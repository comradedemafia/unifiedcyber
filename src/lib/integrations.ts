export interface Integration {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string; // In production, keep secrets server-side
  createdAt?: string;
}

const STORAGE_KEY = 'uc_integrations_v1';

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function getIntegrations(): Integration[] {
  if (typeof window === 'undefined') return [];
  return safeParse<Integration[]>(localStorage.getItem(STORAGE_KEY), []);
}

export function saveIntegrations(list: Integration[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addIntegration(payload: Omit<Integration, 'id' | 'createdAt'>) {
  const list = getIntegrations();
  const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const item: Integration = { ...payload, id, createdAt: new Date().toISOString() };
  const next = [...list, item];
  saveIntegrations(next);
  return item;
}

export function updateIntegration(id: string, patch: Partial<Integration>) {
  const list = getIntegrations();
  const next = list.map(i => (i.id === id ? { ...i, ...patch } : i));
  saveIntegrations(next);
  return next.find(i => i.id === id) ?? null;
}

export function deleteIntegration(id: string) {
  const list = getIntegrations();
  const next = list.filter(i => i.id !== id);
  saveIntegrations(next);
  return next;
}

export async function callIntegration(id: string, path = '/', body?: any, opts?: { method?: string; headers?: Record<string,string> }) {
  const list = getIntegrations();
  const item = list.find(i => i.id === id);
  if (!item) throw new Error('Integration not found');
  const base = item.endpoint.replace(/\/+$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${rel}`;

  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers || {}),
  };
  if (item.apiKey) headers['Authorization'] = `Bearer ${item.apiKey}`;

  const method = opts?.method ?? (body ? 'POST' : 'GET');

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = text;
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) {
    const err: any = new Error(`Request failed ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export default {
  getIntegrations,
  saveIntegrations,
  addIntegration,
  updateIntegration,
  deleteIntegration,
  callIntegration,
};
