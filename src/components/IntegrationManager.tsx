import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Integration = {
  id: string;
  name: string;
  endpoint: string;
  created_at?: string;
};

const API = {
  withAuth: async (opts: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers = Object.assign({}, opts.headers || {}, token ? { Authorization: `Bearer ${token}` } : {});
    return { ...opts, headers };
  },
  list: async () => {
    const opts = await API.withAuth();
    return fetch('/api/v1/integrations', opts).then(r => r.json());
  },
  create: async (body: any) => {
    const opts = await API.withAuth({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return fetch('/api/v1/integrations', opts).then(r => r.json());
  },
  update: async (id: string, body: any) => {
    const opts = await API.withAuth({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return fetch(`/api/v1/integrations/${id}`, opts).then(r => r.json());
  },
  delete: async (id: string) => {
    const opts = await API.withAuth({ method: 'DELETE' });
    return fetch(`/api/v1/integrations/${id}`, opts).then(r => r.json());
  },
  proxy: async (id: string, payload: any) => {
    const opts = await API.withAuth({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return fetch(`/api/v1/integrations/${id}/proxy`, opts).then(r => r.json());
  },
};

export default function IntegrationManager(): JSX.Element {
  const [list, setList] = useState<Integration[]>([]);
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testPath, setTestPath] = useState('/');
  const [testMethod, setTestMethod] = useState('GET');
  const [requestHeaders, setRequestHeaders] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string,string> | null>(null);
  const [lastResponses, setLastResponses] = useState<Record<string, { status?: number; headers?: Record<string,string>; body?: string }>>({});
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEndpoint, setEditEndpoint] = useState('');
  const [editApiKey, setEditApiKey] = useState('');

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    try {
      const res = await API.list();
      if (res?.status === 'success') setList(res.data || []);
      else setList([]);
    } catch (err) {
      setMessage('Unable to load integrations. Check API server and authentication.');
      setList([]);
    }
  }

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name || !endpoint) return setMessage('Provide name and endpoint');
    try {
      const res = await API.create({ name, endpoint, apiKey });
      if (res?.status === 'success' || res?.status === 'created' || res?.data) {
        setName('');
        setEndpoint('');
        setApiKey('');
        setMessage('Integration added successfully.');
        fetchList();
      } else {
        const errorText = res?.message || JSON.stringify(res);
        setMessage('Create failed: ' + errorText);
      }
    } catch (err: any) {
      setMessage('Error: ' + (err?.message || String(err)));
    }
  }

  function startEdit(i: Integration) {
    setEditingId(i.id);
    setEditName(i.name);
    setEditEndpoint(i.endpoint);
    setEditApiKey('');
    setMessage(null);
  }

  async function handleSaveEdit() {
    if (!editingId) return setMessage('No integration selected for edit');
    const payload: any = {};
    if (editName) payload.name = editName;
    if (editEndpoint) payload.endpoint = editEndpoint;
    if (editApiKey !== '') payload.apiKey = editApiKey; // only send if provided
    try {
      const res = await API.update(editingId, payload);
      if (res?.status === 'success') {
        setMessage('Integration updated');
        setEditingId(null);
        setEditName(''); setEditEndpoint(''); setEditApiKey('');
        fetchList();
      } else {
        setMessage('Update failed: ' + JSON.stringify(res));
      }
    } catch (err: any) { setMessage('Error: ' + (err?.message || String(err))); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await API.delete(id);
      if (res?.status === 'success') {
        setMessage('Deleted successfully');
        fetchList();
      } else {
        const errorText = res?.message || JSON.stringify(res);
        setMessage('Delete failed: ' + errorText);
      }
    } catch (err: any) {
      setMessage('Error: ' + (err?.message || String(err)));
    }
  }

  async function handleTest(id: string) {
    setBusy(true);
    setMessage(null);
    setResponseText(null);

    let headers: Record<string, string> | undefined;
    let bodyPayload: any = undefined;

    if (requestHeaders.trim()) {
      try {
        const parsed = JSON.parse(requestHeaders);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Headers must be a JSON object');
        }
        headers = parsed;
      } catch (e: any) {
        setMessage('Invalid request headers JSON: ' + e.message);
        setBusy(false);
        return;
      }
    }

    if (requestBody.trim()) {
      try {
        bodyPayload = JSON.parse(requestBody);
      } catch (e: any) {
        setMessage('Invalid request body JSON: ' + e.message);
        setBusy(false);
        return;
      }
    }

    try {
      const res = await API.proxy(id, {
        path: testPath,
        method: testMethod,
        headers,
        body: bodyPayload,
      });

      if (res?.proxied) {
        const formatted = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
        setMessage(`Proxy OK (${res.status})`);
        setResponseText(formatted);
        setResponseStatus(res.status ?? null);
        setResponseHeaders(res.headers ?? null);
        setLastResponses(prev => ({ ...prev, [id]: { status: res.status ?? undefined, headers: res.headers ?? undefined, body: formatted }}));
      } else {
        const body = JSON.stringify(res);
        setMessage('Proxy failed: ' + body);
        setResponseStatus(res?.status ?? null);
        setResponseHeaders(res?.headers ?? null);
        setLastResponses(prev => ({ ...prev, [id]: { status: res?.status ?? undefined, headers: res?.headers ?? undefined, body }}));
      }
    } catch (err: any) {
      setMessage('Error: ' + (err?.message || String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Integration Manager</h3>
      {message && <div style={{ marginBottom: 8 }}>{message}</div>}

      {editingId ? (
        <div style={{ marginBottom: 12, padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
          <h4>Edit Integration</h4>
          <div>
            <label style={{ display: 'block' }}>Name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block' }}>Endpoint URL</label>
            <input value={editEndpoint} onChange={e => setEditEndpoint(e.target.value)} placeholder="https://example.com/api" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block' }}>API Key (leave blank to keep)</label>
            <input value={editApiKey} onChange={e => setEditApiKey(e.target.value)} placeholder="(optional)" style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSaveEdit}>Save</button>
            <button type="button" onClick={() => { setEditingId(null); setEditName(''); setEditEndpoint(''); setEditApiKey(''); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleAdd} style={{ marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block' }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block' }}>Endpoint URL</label>
            <input
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder="https://example.com/api"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block' }}>API Key (optional)</label>
            <input
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Keep secrets server-side in prod"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit">Add</button>
            <button type="button" onClick={() => { setName(''); setEndpoint(''); setApiKey(''); }}>Clear</button>
          </div>
        </form>
      )}

      <div>
        <h4>Saved Integrations</h4>
        {list.length === 0 ? (
          <div>No integrations configured.</div>
        ) : (
          <ul>
            {list.map(i => (
              <li key={i.id} style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
                <strong>{i.name}</strong> — {i.endpoint}
                {i.created_at && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Created: {new Date(i.created_at).toLocaleString()}
                  </div>
                )}
                <div style={{ marginTop: 8, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button disabled={busy} type="button" onClick={() => handleTest(i.id)}>Test</button>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(i.endpoint)}>Copy</button>
                  <button type="button" onClick={() => startEdit(i)}>Edit</button>
                  <button type="button" onClick={() => handleDelete(i.id)}>Delete</button>
                  {lastResponses[i.id]?.status != null && (
                    <div style={{ marginLeft: 8, fontSize: 12, color: '#333' }}>
                      <strong>Last:</strong> {lastResponses[i.id]?.status}
                    </div>
                  )}
                  <button type="button" onClick={() => setExpandedResponses(prev => ({ ...prev, [i.id]: !prev[i.id] }))}>
                    {expandedResponses[i.id] ? 'Hide last response' : 'Show last response'}
                  </button>
                </div>
                {expandedResponses[i.id] && lastResponses[i.id] && (
                  <div style={{ marginTop: 8, background: '#fafafa', padding: 8, borderRadius: 6 }}>
                    {lastResponses[i.id].headers && (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Headers</strong>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(lastResponses[i.id].headers, null, 2)}</pre>
                      </div>
                    )}
                    {lastResponses[i.id].body && (
                      <div>
                        <strong>Body</strong>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{lastResponses[i.id].body}</pre>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {list.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>Proxy Test Options</h4>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block' }}>Path</label>
            <input value={testPath} onChange={e => setTestPath(e.target.value)} placeholder="/" style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block' }}>Method</label>
            <select value={testMethod} onChange={e => setTestMethod(e.target.value)}>
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block' }}>Request Headers (JSON)</label>
            <textarea
              rows={4}
              value={requestHeaders}
              onChange={e => setRequestHeaders(e.target.value)}
              placeholder='{"Authorization":"Bearer token"}'
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block' }}>Request Body (JSON)</label>
            <textarea
              rows={6}
              value={requestBody}
              onChange={e => setRequestBody(e.target.value)}
              placeholder='{"key":"value"}'
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block' }}>Integration</label>
              <select value={selectedIntegrationId ?? ''} onChange={e => setSelectedIntegrationId(e.target.value || null)} style={{ width: '100%' }}>
                <option value="">Select integration...</option>
                {list.map(i => (
                  <option key={i.id} value={i.id}>{i.name} — {i.endpoint}</option>
                ))}
              </select>
            </div>
            <div>
              <button disabled={busy || !selectedIntegrationId} type="button" onClick={() => { if (selectedIntegrationId) handleTest(selectedIntegrationId); }}>
                Test Selected
              </button>
            </div>
          </div>
          {responseText && (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8, fontSize: 13 }}>
                <strong>Status:</strong> {responseStatus ?? '-'}
              </div>
              {responseHeaders && (
                <div style={{ marginBottom: 8, fontSize: 12, color: '#333' }}>
                  <strong>Headers:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 8, borderRadius: 6 }}>{JSON.stringify(responseHeaders, null, 2)}</pre>
                </div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#eee', padding: 12, borderRadius: 6, maxHeight: 320, overflow: 'auto' }}>
                {responseText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
