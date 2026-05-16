import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Terminal, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { validateEmail, validatePassword, sanitizeInput, rateLimit, checkForSuspiciousActivity } from "@/utils/security";
import { useAuditLogging } from "@/hooks/useAuditLogging";

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

    if (!isSignUp && checkForSuspiciousActivity()) {
      logSecurityEvent("suspicious_activity_blocked", { email: sanitizedEmail });
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
          await logAuthAction('login', 'failed', { email: sanitizedEmail, error: error.message });
          toast({ title: "Login Error", description: error.message, variant: "destructive" });
        } else {
          setSupabaseLog(null);
          setShowResend(false);
          await logAuthAction('login', 'success', { email: sanitizedEmail });
          navigate("/siem");
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
          </form>

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
