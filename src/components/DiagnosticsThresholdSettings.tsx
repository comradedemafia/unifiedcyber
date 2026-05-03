import { Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useThresholds, setThresholds, DEFAULT_THRESHOLDS } from "@/utils/diagnosticsThresholds";

const DiagnosticsThresholdSettings = () => {
  const t = useThresholds();
  return (
    <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-primary" /> Auto-alert Thresholds
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setThresholds(DEFAULT_THRESHOLDS)} className="h-6 px-2 text-[10px] gap-1">
          <RotateCcw className="w-3 h-3" /> Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] font-mono text-muted-foreground">Polling alert (sec)</Label>
          <Input
            type="number" min={5} max={3600}
            value={t.pollingAlertSec}
            onChange={(e) => setThresholds({ pollingAlertSec: Math.max(5, Number(e.target.value) || 0) })}
            className="h-8 text-xs font-mono"
          />
        </div>
        <div>
          <Label className="text-[10px] font-mono text-muted-foreground">CSP burst count</Label>
          <Input
            type="number" min={1} max={1000}
            value={t.cspBurstCount}
            onChange={(e) => setThresholds({ cspBurstCount: Math.max(1, Number(e.target.value) || 0) })}
            className="h-8 text-xs font-mono"
          />
        </div>
        <div>
          <Label className="text-[10px] font-mono text-muted-foreground">CSP window (sec)</Label>
          <Input
            type="number" min={10} max={3600}
            value={t.cspBurstWindowSec}
            onChange={(e) => setThresholds({ cspBurstWindowSec: Math.max(10, Number(e.target.value) || 0) })}
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground font-mono mt-2">
        Live: alerts fire when polling &gt; {t.pollingAlertSec}s OR ≥{t.cspBurstCount} CSP violations within {t.cspBurstWindowSec}s.
      </p>
    </div>
  );
};

export default DiagnosticsThresholdSettings;
