import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, Check, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string; redirect_uris?: string[] };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};
function oauthNs(): OAuthNs {
  return (supabase.auth as unknown as { oauth: OAuthNs }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        setLoading(false);
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so auth returns the user here.
        const next = window.location.pathname + window.location.search;
        navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
        return;
      }
      try {
        const { data, error } = await oauthNs().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauthNs().approveAuthorization(authorizationId)
        : await oauthNs().denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const client = details?.client;
  const clientName = client?.client_name ?? client?.name ?? "an external app";
  const redirectUri = client?.redirect_uri ?? client?.redirect_uris?.[0];
  const scopes =
    details?.scopes ??
    (details?.scope ? details.scope.split(/\s+/).filter(Boolean) : []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary/80">Agent integration</p>
          <h1 className="text-xl font-semibold text-foreground mt-1">Authorize access</h1>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6 space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading authorization request…
            </div>
          ) : error ? (
            <div className="text-sm text-destructive">
              Could not load this authorization request: {error}
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Connect <span className="text-primary">{clientName}</span> to RUCU Cybersecurity
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This lets {clientName} call this app's enabled tools while you are signed in. It does not
                  bypass RUCU's role-based permissions or backend policies.
                </p>
              </div>

              {redirectUri && (
                <div className="text-xs font-mono text-muted-foreground break-all rounded-md border border-border/50 bg-muted/20 p-3">
                  Redirects to: {redirectUri}
                </div>
              )}

              {scopes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Requested permissions
                  </p>
                  <ul className="text-sm text-foreground space-y-1">
                    {scopes.map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span className="font-mono">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => decide(true)}
                  disabled={busy}
                  className="flex-1 gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => decide(false)}
                  disabled={busy}
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel connection
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
