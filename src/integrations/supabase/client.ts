// This file is the Supabase client used by the app.
// It must be configured with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

const createMockQuery = () => {
  const ops: any[] = [];
  const builder: any = {
    select: (s?: any, opts?: any) => { ops.push(["select", s, opts]); return builder; },
    order: (col?: any, opts?: any) => { ops.push(["order", col, opts]); return builder; },
    limit: (n?: any) => { ops.push(["limit", n]); return builder; },
    eq: (k?: any, v?: any) => { ops.push(["eq", k, v]); return builder; },
    insert: (data?: any) => { ops.push(["insert", data]); return builder; },
    upsert: (data?: any) => { ops.push(["upsert", data]); return builder; },
    then: (resolve: any) => {
      resolve({ data: [], error: null, count: 0 });
    }
  };
  return builder;
};

const mockAuth = {
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signUp: async (_opts: any, _params?: any) => ({ data: null, error: null }),
  signInWithPassword: async (_opts: any) => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  resend: async (_opts: any) => ({ error: null }),
  refreshSession: async () => ({ data: { session: null }, error: null }),
};

const mockFunctions = {
  invoke: async (_name: string, _opts?: any) => ({ error: null }),
};

const mockSupabase: any = {
  from: (_table?: string) => createMockQuery(),
  rpc: async (fn: string, params?: any) => {
    switch (fn) {
      case "assign_role_for_signup":
        return { data: { success: true }, error: null };
      case "log_security_event":
        return { data: { id: crypto?.randomUUID?.() ?? "mock-id" }, error: null };
      case "get_audit_logs":
        return { data: [], error: null };
      case "validate-data":
        return { data: { valid: true, cleaned: params ?? {} }, error: null };
      default:
        return { data: null, error: null };
    }
  },
  functions: mockFunctions,
  auth: mockAuth,
  storage: {
    from: () => ({ list: async () => ({ data: null, error: null }) }),
  },
  channel: () => ({ subscribe: async () => ({}) }),
};

let supabaseClient: any = mockSupabase;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export const supabase = supabaseClient as ReturnType<typeof createClient> & Database;
