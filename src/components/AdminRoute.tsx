import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-muted-foreground">Verifying admin privileges…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-destructive/40 rounded-xl p-6 text-center">
          <ShieldOff className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Operational tools (Terminal, Scanner, Incident Response, Threat Intel, Playbooks)
            are restricted to administrators. Your account does not have the <code className="font-mono">admin</code> role.
          </p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={() => navigate("/")}>
              <Shield className="w-3 h-3 mr-1" /> Back to home
            </Button>
            <Button size="sm" onClick={() => navigate("/siem")}>
              View SIEM (read-only)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
