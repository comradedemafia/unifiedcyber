import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { validateEmail, sanitizeInput, rateLimit, logSecurityEvent } from "@/utils/security";
import { getAppBaseUrl } from "@/utils/appUrl";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeInput(email);

    if (!validateEmail(cleanEmail)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    if (!rateLimit(`reset_${cleanEmail}`, 3, 15 * 60 * 1000)) {
      toast({ title: "Too Many Attempts", description: "Please wait 15 minutes before requesting another reset.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${getAppBaseUrl()}/reset-password`,
      });

      if (error) {
        logSecurityEvent("password_reset_request_failed", { email: cleanEmail, error: error.message });
        toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
      } else {
        logSecurityEvent("password_reset_requested", { email: cleanEmail });
        setSent(true);
        toast({
          title: "Check Your Email",
          description: "If an account exists for this email, a password reset link has been sent.",
        });
      }
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
          <h1 className="text-lg font-semibold text-foreground">Reset Your Password</h1>
          <p className="text-xs text-muted-foreground mt-1">We will email you a secure reset link</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-6">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">Email Sent</h2>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <span className="font-mono">{email}</span>, we sent a password reset link.
                  The link expires in 1 hour. Check your inbox and spam folder.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/login")} className="w-full font-mono text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="bg-muted/30 border-border/50 font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Enter the email associated with your account. A verified reset link will be sent to your inbox.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full font-mono text-sm">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
