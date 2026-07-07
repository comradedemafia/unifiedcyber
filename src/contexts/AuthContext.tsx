import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logSecurityEvent } from "@/utils/security";
import { logAuthEvent } from "@/utils/api-validation";
import { getAppBaseUrl } from "@/utils/appUrl";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string, role?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const touchSecurityActivity = useCallback(() => {
    const now = Date.now();
    localStorage.setItem("security_last_activity", now.toString());
    localStorage.setItem("security_last_event", new Date().toISOString());
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        touchSecurityActivity();
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      logSecurityEvent("session_refresh_failed", { error: error instanceof Error ? error.message : String(error) });
      await signOut();
    }
  }, [touchSecurityActivity]);

  useEffect(() => {
    let mounted = true;
    let sessionCheckInterval: NodeJS.Timeout;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event);
      logSecurityEvent("auth_state_change", { event, user: session?.user?.email });

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        touchSecurityActivity();
      }

      if (event === "SIGNED_OUT") {
        localStorage.removeItem("security_last_activity");
        localStorage.removeItem("security_last_event");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const handleUserActivity = () => {
      if (!mounted) return;
      touchSecurityActivity();
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "visibilitychange"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleUserActivity));

    sessionCheckInterval = setInterval(async () => {
      if (!mounted) return;

      const { data: { session: currentSession }, error: checkError } = await supabase.auth.getSession();
      if (checkError) {
        console.error("Session check failed:", checkError);
        logSecurityEvent("session_check_failed", { error: checkError.message });
      }

      if (!mounted) return;
      setSession(currentSession);

      const lastActivity = localStorage.getItem("security_last_activity");
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
        if (timeSinceActivity > 60 * 60 * 1000) {
          logSecurityEvent("auto_sign_out_inactivity", { idleMinutes: Math.floor(timeSinceActivity / 60000) });
          void logAuthEvent("logout", "success", { reason: "auto_sign_out_inactivity", idleMinutes: Math.floor(timeSinceActivity / 60000) });
          await signOut();
          return;
        }
      }

      if (currentSession?.expires_at) {
        const timeToExpiry = currentSession.expires_at * 1000 - Date.now();
        if (timeToExpiry < 5 * 60 * 1000) {
          await refreshSession();
        }
      }
    }, 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (sessionCheckInterval) clearInterval(sessionCheckInterval);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleUserActivity));
    };
  }, [refreshSession, touchSecurityActivity]);

  const signUp = async (email: string, password: string, displayName?: string, role: string = "user") => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      }, {
        options: {
          data: { display_name: displayName, preferred_role: role },
          emailRedirectTo: getAppBaseUrl(),
        },
      });

      if (!error) {
        touchSecurityActivity();
        logSecurityEvent("signup_success", { email, role });
        void logAuthEvent("signup", "success", { email, role });

        if (data?.user?.id) {
          // Use secure RPC to assign allowed signup roles (prevents client from assigning admin)
          const { error: roleError } = await supabase.rpc("assign_role_for_signup", { _user_id: data.user.id, _role: role });
          if (roleError) {
            console.warn("Role assignment failed during signup via RPC:", roleError.message);
            logSecurityEvent("role_assignment_failed", { email, role, error: roleError.message });
          }
        }
      }

      return { error };
    } catch (error) {
      console.error("Sign up error:", error);
      logSecurityEvent("signup_error", { email, error: error instanceof Error ? error.message : String(error) });
      void logAuthEvent("signup", "failed", { email, error: error instanceof Error ? error.message : String(error) });
      return { error };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: getAppBaseUrl() },
      });
      if (!error) {
        touchSecurityActivity();
        logSecurityEvent("resend_verification_success", { email });
      void logAuthEvent("password_reset", "success", { email });
      } else {
        logSecurityEvent("resend_verification_error", { email, error: error.message });
        void logAuthEvent("password_reset", "failed", { email, error: error.message });
      }
      return { error };
    } catch (error) {
      console.error("Resend verification error:", error);
      logSecurityEvent("resend_verification_error", { email, error: error instanceof Error ? error.message : String(error) });
      void logAuthEvent("password_reset", "failed", { email, error: error instanceof Error ? error.message : String(error) });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        touchSecurityActivity();
        logSecurityEvent("signin_success", { email });
        void logAuthEvent("login", "success", { email });
      }
      if (error) {
        void logAuthEvent("login", "failed", { email, error: error instanceof Error ? error.message : String(error) });
      }
      return { error };
    } catch (error) {
      console.error("Sign in error:", error);
      logSecurityEvent("signin_error", { email, error: error instanceof Error ? error.message : String(error) });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem("security_last_activity");
      localStorage.removeItem("security_last_event");
      logSecurityEvent("signout", { user: user?.email });
    } catch (error) {
      console.error("Sign out error:", error);
      logSecurityEvent("signout_error", { error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, resendVerificationEmail, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
