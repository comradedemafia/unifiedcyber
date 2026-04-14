import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Terminal, Eye, EyeOff, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { validateEmail, validatePassword, sanitizeInput, rateLimit, logSecurityEvent, checkForSuspiciousActivity } from "@/utils/security";
import { useAuditLogging } from "@/hooks/useAuditLogging";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAuthAction } = useAuditLogging({ showNotifications: true });

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
        const { error } = await signUp(sanitizedEmail, sanitizedPassword, sanitizedDisplayName);
        if (error) {
          logSecurityEvent("signup_failed", { email: sanitizedEmail, error: error.message });
          await logAuthAction('signup', 'failed', { email: sanitizedEmail, error: error.message });
          toast({ title: "Signup Error", description: error.message, variant: "destructive" });
        } else {
          logSecurityEvent('signup_success', { email: sanitizedEmail });
          await logAuthAction('signup', 'success', { email: sanitizedEmail });
          toast({ title: "Account Created", description: "Please check your email to verify your account." });
        }
      } else {
        const { error } = await signIn(sanitizedEmail, sanitizedPassword);
        if (error) {
          logSecurityEvent("login_failed", { email: sanitizedEmail, error: error.message });
          await logAuthAction('login', 'failed', { email: sanitizedEmail, error: error.message });
          toast({ title: "Login Error", description: error.message, variant: "destructive" });
        } else {
          logSecurityEvent('login_success', { email: sanitizedEmail });
          await logAuthAction('login', 'success', { email: sanitizedEmail });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logSecurityEvent("auth_error", { email: sanitizedEmail, error: message });
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-4 font-mono">
          Secure access to UCSF Cyber Defense Dashboard
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
