import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import { ShieldCheck, User as UserIcon, Search } from "lucide-react";

const RoleBadge = () => {
  const { roles, isAdmin, isModerator, loading } = useUserRole();
  if (loading) return null;
  const label = isAdmin ? "admin" : isModerator ? "analyst" : roles[0] ?? "user";
  const Icon = isAdmin ? ShieldCheck : isModerator ? Search : UserIcon;
  const variant = isAdmin ? "default" : "secondary";
  return (
    <Badge variant={variant as any} className="text-[9px] gap-1 hidden sm:inline-flex">
      <Icon className="w-2.5 h-2.5" /> {label}
    </Badge>
  );
};

export default RoleBadge;
