import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Globe } from "lucide-react";

interface Props {
  open: boolean;
  command: string;
  args: string[];
  target?: string;
  onConfirm: () => void;
  onCancel: () => void;
  rememberTarget: boolean;
  onToggleRemember: (v: boolean) => void;
}

const RealCommandConfirm = ({
  open, command, args, target, onConfirm, onCancel, rememberTarget, onToggleRemember,
}: Props) => (
  <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="w-4 h-4 text-warning" />
          Confirm real network command
        </DialogTitle>
        <DialogDescription className="text-xs">
          This will execute a <strong>real</strong> outbound request from the server. Only safe,
          read-only commands are permitted (curl/wget/dig/whois/ping/nslookup/ipinfo).
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <Globe className="w-3 h-3" /> command
          </div>
          <div className="text-foreground break-all">
            {command} {args.join(" ")}
          </div>
          {target && (
            <div className="mt-2 pt-2 border-t border-border/50 text-[11px]">
              <span className="text-muted-foreground">target host:</span>{" "}
              <span className="text-primary">{target}</span>
            </div>
          )}
        </div>

        {target && (
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono cursor-pointer">
            <input
              type="checkbox"
              checked={rememberTarget}
              onChange={(e) => onToggleRemember(e.target.checked)}
              className="accent-primary"
            />
            Allow <span className="text-primary">{target}</span> for this session (skip future prompts)
          </label>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onConfirm}>Run</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default RealCommandConfirm;
