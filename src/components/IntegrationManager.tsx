import React, { useEffect, useState } from 'react';

export type Integration = {
  id: string;
  name: string;
  endpoint: string;
  created_at?: string;
};

const API = {
  list: () => fetch('/api/v1/integrations').then(r => r.json()),
  create: (body: any) => fetch('/api/v1/integrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  delete: (id: string) => fetch(`/api/v1/integrations/${id}`, { method: 'DELETE' }).then(r => r.json()),
  proxy: (id: string, payload: any) => fetch(`/api/v1/integrations/${id}/proxy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
};

export default function IntegrationManager(): JSX.Element {
  const [list, setList] = useState<Integration[]>([]);
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    try {
      const res = await API.list();
      if (res?.status === 'success') setList(res.data || []);
      else setList([]);
    } catch (err) {
      setList([]);
    }
  }

  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name || !endpoint) return setMessage('Provide name and endpoint');
    try {
      const res = await API.create({ name, endpoint, apiKey });
      if (res?.status === 'success' || res?.status === 'created' || res?.data) {
        setName(''); setEndpoint(''); setApiKey('');
        setMessage('Integration added');
        fetchList();
      } else {
        setMessage('Create failed');
      }
    } catch (err: any) { setMessage('Error: ' + (err?.message || String(err))); }
  }

  async function handleDelete(id: string) {
    try {
      const res = await API.delete(id);
      if (res?.status === 'success') {
        setMessage('Deleted');
        fetchList();
      } else setMessage('Delete failed');
    } catch (err: any) { setMessage('Error: ' + (err?.message || String(err))); }
  }

  async function handleTest(id: string) {
    setBusy(true); setMessage(null);
    try {
      const res = await API.proxy(id, { path: '/', method: 'GET' });
      if (res?.proxied) setMessage('OK — ' + JSON.stringify(res.data).slice(0, 200));
      else setMessage('Proxy failed: ' + JSON.stringify(res));
    } catch (err: any) {
      setMessage('Error: ' + (err?.message || String(err)));
    } finally { setBusy(false); }
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Integration Manager</h3>
      {message && <div style={{ marginBottom: 8 }}>{message}</div>}

      <form onSubmit={handleAdd} style={{ marginBottom: 12 }}>
        <div>
          <label style={{ display: 'block' }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block' }}>Endpoint URL</label>
          <input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://example.com/api" />
        </div>
        <div>
          <label style={{ display: 'block' }}>API Key (optional)</label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Keep secrets server-side in prod" />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Add</button>
          <button type="button" onClick={() => { setName(''); setEndpoint(''); setApiKey(''); }}>Clear</button>
        </div>
      </form>

      <div>
        <h4>Saved Integrations</h4>
        {list.length === 0 && <div>No integrations configured.</div>}
        <ul>
          {list.map(i => (
            <li key={i.id} style={{ marginBottom: 8 }}>
              <strong>{i.name}</strong> — {i.endpoint}
              <div style={{ marginTop: 4 }}>
                <button disabled={busy} onClick={() => handleTest(i.id)}>Test</button>
                <button onClick={() => navigator.clipboard?.writeText(i.endpoint)}>Copy</button>
                <button onClick={() => handleDelete(i.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
