import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';

dotenv.config();

const PORT = parseInt(process.env.TERMINAL_PORT ?? '4000', 10);
const SHELL = process.env.TERMINAL_SHELL ?? '/bin/bash';
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const ALLOWED_ROLES = (process.env.TERMINAL_ALLOWED_ROLES ?? 'admin,moderator').split(',').map((role) => role.trim().toLowerCase());
const HOME_DIR = process.env.TERMINAL_HOME || process.env.HOME || '/tmp';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment. Cannot start terminal proxy.');
  process.exit(1);
}

const logFilePath = path.join(process.cwd(), 'server', 'terminal-server.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function logMessage(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.join(' ')}`;
  logStream.write(`${line}\n`);
  console.log(line);
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text), text };
  } catch (error) {
    return { ok: res.ok, status: res.status, json: null, text };
  }
}

async function getUser(token) {
  const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/user`;
  const response = await fetchJson(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_KEY,
      Accept: 'application/json',
    },
  });
  if (!response.ok) return null;
  return response.json;
}

async function getUserRoles(userId, token) {
  const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/user_roles?select=role&user_id=eq.${encodeURIComponent(userId)}`;
  const response = await fetchJson(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_KEY,
      Accept: 'application/json',
    },
  });
  if (!response.ok || !Array.isArray(response.json)) return [];
  return response.json.map((row) => String(row.role).toLowerCase());
}

async function insertAudit(user, token, payload) {
  try {
    const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/terminal_audit_log`;
    const body = [{
      user_id: user.id,
      user_email: user.email,
      event_type: payload.event_type,
      command: payload.command ?? null,
      target: payload.target ?? null,
      result: payload.result ?? null,
      severity: payload.severity ?? 'info',
      details: payload.details ?? {},
    }];
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      logMessage('Audit insert failed', String(response.status), text);
    }
  } catch (error) {
    logMessage('Audit insert error', error?.message ?? String(error));
  }
}

function createServer() {
  const httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Terminal proxy server is running');
  });

  const wss = new WebSocketServer({ server: httpServer, path: '/terminal' });

  wss.on('connection', async (socket, req) => {
    const requestUrl = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
    const token = requestUrl.searchParams.get('token');

    if (!token) {
      socket.close(4001, 'Missing access token');
      return;
    }

    const user = await getUser(token);
    if (!user?.user) {
      socket.close(4002, 'Invalid or expired auth token');
      return;
    }

    const roles = await getUserRoles(user.user.id, token);
    const authorized = roles.some((role) => ALLOWED_ROLES.includes(role));
    if (!authorized) {
      socket.close(4003, 'Unauthorized role for terminal access');
      return;
    }

    logMessage('Terminal session opened for', user.user.email, 'roles=', roles.join(','));
    await insertAudit(user.user, token, {
      event_type: 'real_command',
      command: 'terminal_open',
      result: 'success',
      severity: 'info',
      details: { roles, shell: SHELL },
    });

    const ptyProcess = pty.spawn(SHELL, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 28,
      cwd: HOME_DIR,
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    socket.send(JSON.stringify({ type: 'ready', data: `Connected to ${SHELL} as ${user.user.email}` }));

    ptyProcess.onData((data) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: 'output', data }));
      }
    });

    socket.on('message', async (message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.type === 'input' && typeof payload.data === 'string') {
          const trimmed = payload.data.replace(/\r?\n$/, '');
          logMessage('Shell input from', user.user.email, ':', trimmed);
          await insertAudit(user.user, token, {
            event_type: 'real_command',
            command: trimmed,
            result: 'success',
            severity: 'info',
            details: {},
          });
          ptyProcess.write(payload.data);
        } else if (payload.type === 'resize' && typeof payload.cols === 'number' && typeof payload.rows === 'number') {
          ptyProcess.resize(payload.cols, payload.rows);
        }
      } catch (error) {
        socket.send(JSON.stringify({ type: 'error', data: `Invalid terminal payload: ${error?.message ?? String(error)}` }));
      }
    });

    const cleanup = () => {
      if (ptyProcess) {
        try {
          ptyProcess.kill();
        } catch (error) {
          logMessage('Error killing pty:', error?.message ?? String(error));
        }
      }
    };

    socket.on('close', () => {
      logMessage('Terminal session closed for', user.user.email);
      cleanup();
    });

    socket.on('error', (error) => {
      logMessage('Socket error for', user.user.email, ':', error?.message ?? String(error));
      cleanup();
    });
  });

  httpServer.listen(PORT, () => {
    logMessage(`Terminal proxy listening on http://localhost:${PORT}/terminal`);
  });
}

createServer();
