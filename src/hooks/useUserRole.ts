import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (error) {
        console.error("Failed to load roles:", error.message);
        setRoles([]);
      } else {
        setRoles((data ?? []).map((r: { role: AppRole }) => r.role));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("moderator"),
    loading: loading || authLoading,
  };
}
