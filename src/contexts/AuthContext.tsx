import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      // Force sign out on refresh failure
      await signOut();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let sessionCheckInterval: NodeJS.Timeout;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event);

      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Log security events
      if (event === 'SIGNED_IN') {
        localStorage.setItem('security_last_activity', Date.now().toString());
        console.log("Security: User signed in");
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('security_last_activity');
        console.log("Security: User signed out");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Session security check every 5 minutes
    sessionCheckInterval = setInterval(async () => {
      if (!mounted) return;

      const lastActivity = localStorage.getItem('security_last_activity');
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        // Auto sign out after 2 hours of inactivity
        if (timeSinceActivity > 2 * 60 * 60 * 1000) {
          console.log("Security: Auto sign out due to inactivity");
          await signOut();
          return;
        }
      }

      // Refresh session if close to expiry
      if (session?.expires_at) {
        const timeToExpiry = session.expires_at * 1000 - Date.now();
        if (timeToExpiry < 5 * 60 * 1000) { // Less than 5 minutes
          await refreshSession();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (sessionCheckInterval) clearInterval(sessionCheckInterval);
    };
  }, [refreshSession]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (!error) {
        localStorage.setItem('security_last_activity', Date.now().toString());
      }
      return { error };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        localStorage.setItem('security_last_activity', Date.now().toString());
      }
      return { error };
    } catch (error) {
      console.error("Sign in error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      // Clear any local storage security data
      localStorage.removeItem('security_last_activity');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
