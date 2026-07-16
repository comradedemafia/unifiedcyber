import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Terminal, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { validateEmail, validatePassword, sanitizeInput, rateLimit, logSecurityEvent, checkForSuspiciousActivity, recordFailedLoginAttempt } from "@/utils/security";
import { useAuditLogging } from "@/hooks/useAuditLogging";
import { lovable } from "@/integrations/lovable";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [supabaseLog, setSupabaseLog] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const { signIn, signUp, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { logAuthAction } = useAuditLogging({ showNotifications: true });

  const nextParam = (() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("next");
    // Only accept same-origin relative paths.
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return null;
  })();
  const postAuthTarget = nextParam ?? "/siem";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mode") === "signup") {
      setIsSignUp(true);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = password;
    const sanitizedDisplayName = sanitizeInput(displayName);

    if (!validateEmail(sanitizedEmail)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    if (!isSignUp && checkForSuspiciousActivity(sanitizedEmail)) {
      toast({
        title: "Suspicious Activity Detected",
        description: "Multiple failed login attempts were detected. Try again after 15 minutes.",
        variant: "destructive",
      });
      return;
    }

    if (!rateLimit(sanitizedEmail, 5, 15 * 60 * 1000)) {
      logSecurityEvent("rate_limit_exceeded", { email: sanitizedEmail });
      toast({ title: "Too Many Attempts", description: "Please wait before trying again.", variant: "destructive" });
      return;
    }

    if (isSignUp) {
      const passwordValidation = validatePassword(sanitizedPassword);
      if (!passwordValidation.valid) {
        toast({ title: "Weak Password", description: passwordValidation.errors.join(", "), variant: "destructive" });
        return;
      }

      if (!sanitizedDisplayName.trim()) {
        toast({ title: "Display Name Required", description: "Please enter a display name.", variant: "destructive" });
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(sanitizedEmail, sanitizedPassword, sanitizedDisplayName, role);
        if (error) {
          const errorText = typeof error === "object" ? JSON.stringify(error, null, 2) : String(error);
          setSupabaseLog(errorText);
          setShowResend(true);
          await logAuthAction('signup', 'failed', { email: sanitizedEmail, error: error.message });
          toast({ title: "Signup Error", description: error.message, variant: "destructive" });
        } else {
          setSupabaseLog(null);
          setShowResend(true);
          setResendMessage("Confirmation email sent. Use the button below if it did not arrive.");
          await logAuthAction('signup', 'success', { email: sanitizedEmail });
          toast({ title: "Account Created", description: "Please check your email to verify your account." });
        }
      } else {
        const { error } = await signIn(sanitizedEmail, sanitizedPassword);
        if (error) {
          const errorText = typeof error === "object" ? JSON.stringify(error, null, 2) : String(error);
          setSupabaseLog(errorText);
          setShowResend(/not confirmed|verify.*email|verification/i.test(error.message));
          recordFailedLoginAttempt(sanitizedEmail);
          await logAuthAction('login', 'failed', { email: sanitizedEmail, error: error.message });

          const isInvalidCreds =
            (error as any)?.code === "invalid_credentials" ||
            /invalid login credentials/i.test(error.message || "");

          toast({
            title: isInvalidCreds ? "Incorrect email or password" : "Login Error",
            description: isInvalidCreds
              ? 'Please check your email and password. If you have forgotten your password, click "Forgot password?" below to reset it.'
              : error.message,
            variant: "destructive",
          });
        } else {
          setSupabaseLog(null);
          setShowResend(false);
          await logAuthAction('login', 'success', { email: sanitizedEmail });
          navigate(postAuthTarget);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSupabaseLog(typeof error === "object" ? JSON.stringify(error, null, 2) : String(error));
      setShowResend(/not confirmed|verify.*email|verification/i.test(message));
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (!email) return;
    setResendLoading(true);
    setResendMessage(null);
    setSupabaseLog(null);

    const { error } = await resendVerificationEmail(sanitizeInput(email));
    if (error) {
      const errorText = typeof error === "object" ? JSON.stringify(error, null, 2) : String(error);
      setSupabaseLog(errorText);
      setResendMessage("Resend failed. Check the error details below.");
      toast({ title: "Resend Failed", description: error.message, variant: "destructive" });
    } else {
      setResendMessage("Verification email resent. Check your inbox and spam folder.");
      toast({ title: "Email Sent", description: "Verification email resent successfully." });
    }

    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-3 h-3 text-primary/50" />
            <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">UCSF</span>
          </div>
          <p className="text-xs text-muted-foreground">Unified Cyber Security Framework</p>
        </div>

        {/* Form Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6">
          <div className="flex flex-col gap-4 mb-6 rounded-3xl border border-border/50 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary/80 mb-1">Secure access portal</p>
                <h2 className="text-lg font-semibold text-foreground">Login or register to continue</h2>
              </div>
              <div className="rounded-2xl bg-primary/10 px-3 py-2 text-[11px] font-mono uppercase text-primary">AI powered</div>
            </div>
            <p className="text-sm text-muted-foreground leading-6">
              After login, use your role-based access to reach Dashboard, Alerts, Monitoring, Logs, Terminal tools and Incident Response workflows inside the platform.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="rounded-2xl border border-border/50 bg-background/80 p-3">
                <p className="font-semibold text-foreground">Dashboard</p>
                <p>Live overview of security state and analytics.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/80 p-3">
                <p className="font-semibold text-foreground">Alerts</p>
                <p>Immediate threat notifications with context.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/80 p-3">
                <p className="font-semibold text-foreground">Monitoring</p>
                <p>Continuous system and network visibility.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/80 p-3">
                <p className="font-semibold text-foreground">Logs</p>
                <p>Ordered audit logs for every activity.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1 mb-6 bg-muted/30 rounded-lg p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-xs font-mono rounded-md transition-all flex items-center justify-center gap-1.5 ${!isSignUp ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LogIn className="w-3 h-3" /> Login
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-xs font-mono rounded-md transition-all flex items-center justify-center gap-1.5 ${isSignUp ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <UserPlus className="w-3 h-3" /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Admin"
                  className="bg-muted/30 border-border/50 font-mono text-sm"
                />
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "User", value: "user", description: "Basic monitoring and incident awareness." },
                    { label: "Analyst", value: "moderator", description: "SIEM and threat investigation tools." },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`rounded-xl border px-3 py-3 text-left transition-all ${role === option.value ? "border-primary bg-primary/10 text-foreground" : "border-border/50 bg-card text-muted-foreground hover:border-primary/60"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-sm">{option.label}</span>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground/70">{role === option.value ? "Selected" : "Select"}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Admin accounts are managed by the security operations team. Choose the role that matches your access level.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="bg-muted/30 border-border/50 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
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
            </div>

            <Button type="submit" disabled={loading} className="w-full font-mono text-sm gap-2">
              {loading ? "Processing..." : isSignUp ? "Create Account" : "Access Dashboard"}
              <ArrowRight className="w-4 h-4" />
            </Button>

            {!isSignUp && (
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-xs font-mono text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </form>

          <div className="mt-4">
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full font-mono text-sm gap-2"
                onClick={async () => {
                  try {
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (result.error) {
                      toast({ title: "Google Sign-In Error", description: result.error.message || String(result.error), variant: "destructive" });
                      return;
                    }
                    if (result.redirected) return;
                    navigate("/siem");
                  } catch (err) {
                    toast({ title: "Google Sign-In Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
                  }
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58v2.97h3.85c2.25-2.08 3.58-5.15 3.58-8.79z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.94l-3.85-2.97c-1.07.72-2.44 1.16-4.08 1.16-3.14 0-5.8-2.12-6.75-4.97H1.27v3.11C3.25 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.25 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l3.98-3.11z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l3.98 3.11C6.2 6.87 8.86 4.75 12 4.75z"/>
                </svg>
                Sign in with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full font-mono text-sm gap-2 bg-black text-white hover:bg-black/90 hover:text-white border-black"
                onClick={async () => {
                  try {
                    const result = await lovable.auth.signInWithOAuth("apple", {
                      redirect_uri: window.location.origin,
                    });
                    if (result.error) {
                      toast({ title: "Apple Sign-In Error", description: result.error.message || String(result.error), variant: "destructive" });
                      return;
                    }
                    if (result.redirected) return;
                    navigate("/siem");
                  } catch (err) {
                    toast({ title: "Apple Sign-In Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
                  }
                }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                  <path d="M16.365 1.43c0 1.14-.42 2.22-1.24 3.03-.81.81-2.11 1.44-3.19 1.35-.13-1.12.42-2.28 1.2-3.06.85-.87 2.29-1.5 3.23-1.32zM20.5 17.13c-.55 1.27-.82 1.83-1.53 2.95-1 1.55-2.4 3.48-4.14 3.5-1.54.02-1.94-1.01-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.74-.03-3.07-1.77-4.07-3.32C.36 16.68-.31 11.53 1.9 8.72c1.57-2.01 4.05-3.19 6.39-3.19 2.39 0 3.89 1.31 5.86 1.31 1.91 0 3.08-1.31 5.84-1.31 2.09 0 4.3 1.14 5.87 3.11-5.16 2.83-4.32 10.2-1.36 8.49z"/>
                </svg>
                Sign in with Apple
              </Button>
            </div>
          </div>


          {resendMessage && (
            <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
              {resendMessage}
            </div>
          )}

          {showResend && (
            <div className="mt-4 flex flex-col gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={resendLoading}
                onClick={handleResendClick}
                className="w-full font-mono text-sm"
              >
                {resendLoading ? "Resending..." : "Resend verification email"}
              </Button>
              <p className="text-xs text-muted-foreground">
                If the confirmation email does not arrive, check your spam folder and verify the email address is correct.
              </p>
            </div>
          )}

          {supabaseLog && (
            <div className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-3 text-xs font-mono text-slate-800 whitespace-pre-wrap">
              <strong className="block text-sm font-semibold text-slate-900">Debug log</strong>
              {supabaseLog}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-4 font-mono">
          Secure access to UCSF Cyber Defense Dashboard
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
