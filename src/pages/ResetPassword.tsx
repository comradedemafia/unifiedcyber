import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { validatePassword, logSecurityEvent } from "@/utils/security";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase places recovery token in URL hash (#access_token=...&type=recovery)
    // The client auto-processes it and fires a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidSession(true);
      }
    });

    // Also check any existing recovery session synchronously
    supabase.auth.getSession().then(({ data }) => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const isRecovery = /type=recovery/.test(hash) || !!data.session;
      if (isRecovery && data.session) setValidSession(true);
      else if (!hash && !data.session) setValidSession(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePassword(password);
    if (!validation.valid) {
      toast({ title: "Weak Password", description: validation.errors.join(", "), variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords Don't Match", description: "Please confirm the same password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        logSecurityEvent("password_reset_failed", { error: error.message });
        toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
        return;
      }

      logSecurityEvent("password_reset_success", {});

      // Revoke ALL other active sessions on all devices for this user
      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch {
        // fall back to local sign-out
        await supabase.auth.signOut();
      }

      setDone(true);
      toast({
        title: "Password Updated",
        description: "Your password was updated and all other sessions were signed out.",
      });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Set a New Password</h1>
          <p className="text-xs text-muted-foreground mt-1">Your new password must be strong and unique</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6">
          {done ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="p-3 rounded-full bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">Password Updated</h2>
                <p className="text-sm text-muted-foreground">
                  All other sessions have been signed out. Redirecting to login...
                </p>
              </div>
              <Button onClick={() => navigate("/login")} className="w-full font-mono text-sm">
                Go to Login
              </Button>
            </div>
          ) : validSession === false ? (
            <div className="text-center space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Invalid or expired reset link. Please request a new password reset email.
              </p>
              <Button onClick={() => navigate("/forgot-password")} className="w-full font-mono text-sm">
                Request New Reset Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={10}
                    className="bg-muted/30 border-border/50 font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  At least 10 characters with uppercase, lowercase, number and special character.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">Confirm New Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={10}
                  className="bg-muted/30 border-border/50 font-mono text-sm"
                />
              </div>

              <Button type="submit" disabled={loading || validSession !== true} className="w-full font-mono text-sm">
                {loading ? "Updating..." : "Update Password"}
              </Button>

              {validSession === null && (
                <p className="text-center text-[11px] text-muted-foreground">Verifying reset link...</p>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
