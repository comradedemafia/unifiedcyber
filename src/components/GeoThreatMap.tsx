import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealtimeIncidents } from "@/hooks/useRealtimeIncidents";
type Incident = any;


interface ThreatPoint {
  ip: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
  severity: string;
  type: string;
  count: number;
}

const IP_GEO_MAP: Record<string, { lat: number; lng: number; country: string; city: string }> = {
  "10.": { lat: 39.9, lng: 116.4, country: "China", city: "Beijing" },
  "172.": { lat: 55.75, lng: 37.62, country: "Russia", city: "Moscow" },
  "192.168": { lat: 35.68, lng: 139.69, country: "Japan", city: "Tokyo" },
  "203.": { lat: 1.35, lng: 103.82, country: "Singapore", city: "Singapore" },
  "45.": { lat: 51.51, lng: -0.13, country: "UK", city: "London" },
  "91.": { lat: 48.86, lng: 2.35, country: "France", city: "Paris" },
  "185.": { lat: 50.45, lng: 30.52, country: "Ukraine", city: "Kyiv" },
  "77.": { lat: 52.52, lng: 13.41, country: "Germany", city: "Berlin" },
  "200.": { lat: -23.55, lng: -46.63, country: "Brazil", city: "São Paulo" },
  "41.": { lat: -6.17, lng: 35.74, country: "Tanzania", city: "Dodoma" },
  "105.": { lat: 6.52, lng: 3.38, country: "Nigeria", city: "Lagos" },
  "156.": { lat: 37.57, lng: 126.98, country: "South Korea", city: "Seoul" },
  "14.": { lat: 13.76, lng: 100.5, country: "Thailand", city: "Bangkok" },
  "31.": { lat: 41.01, lng: 28.98, country: "Turkey", city: "Istanbul" },
  "62.": { lat: 59.33, lng: 18.07, country: "Sweden", city: "Stockholm" },
};

const KNOWN_LOCATIONS: { lat: number; lng: number; country: string; city: string }[] = [
  { lat: 39.9, lng: 116.4, country: "China", city: "Beijing" },
  { lat: 55.75, lng: 37.62, country: "Russia", city: "Moscow" },
  { lat: 40.71, lng: -74.01, country: "USA", city: "New York" },
  { lat: 51.51, lng: -0.13, country: "UK", city: "London" },
  { lat: -23.55, lng: -46.63, country: "Brazil", city: "São Paulo" },
  { lat: 28.61, lng: 77.21, country: "India", city: "New Delhi" },
  { lat: 35.68, lng: 139.69, country: "Japan", city: "Tokyo" },
  { lat: -6.17, lng: 35.74, country: "Tanzania", city: "Dodoma" },
  { lat: 48.86, lng: 2.35, country: "France", city: "Paris" },
  { lat: 52.52, lng: 13.41, country: "Germany", city: "Berlin" },
];

function ipToGeo(ip: string): { lat: number; lng: number; country: string; city: string } {
  for (const [prefix, geo] of Object.entries(IP_GEO_MAP)) {
    if (ip.startsWith(prefix)) return geo;
  }
  const hash = ip.split(".").reduce((a, b) => a + parseInt(b || "0"), 0);
  return KNOWN_LOCATIONS[hash % KNOWN_LOCATIONS.length];
}

// Mercator projection
function project(lat: number, lng: number, w: number, h: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * w;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = h / 2 - (mercN / Math.PI) * (h / 2);
  return { x, y };
}

// Simplified world map paths (continent outlines)
const WORLD_PATHS = [
  // North America
  "M 60,80 L 80,60 L 130,55 L 160,70 L 155,95 L 140,110 L 120,130 L 100,125 L 80,105 L 65,95 Z",
  // South America
  "M 130,155 L 145,140 L 160,145 L 165,170 L 160,200 L 145,220 L 130,230 L 120,210 L 125,180 Z",
  // Europe
  "M 240,60 L 260,55 L 280,58 L 290,65 L 285,80 L 270,85 L 255,82 L 245,75 Z",
  // Africa
  "M 240,100 L 260,90 L 280,95 L 290,110 L 285,140 L 275,170 L 260,180 L 245,170 L 235,140 L 238,115 Z",
  // Asia
  "M 280,50 L 320,40 L 370,45 L 400,55 L 410,75 L 395,95 L 370,100 L 340,95 L 310,85 L 290,75 Z",
  // Oceania
  "M 370,160 L 400,155 L 415,165 L 410,180 L 390,185 L 375,175 Z",
  // Australia
  "M 380,175 L 410,170 L 425,180 L 420,200 L 395,205 L 380,195 Z",
];

interface GeoThreatMapProps {
  events?: Array<{ source_ip?: string; severity?: string; alert_type?: string; incident_type?: string; action?: string }>;
}

const GeoThreatMap = ({ events: propEvents }: GeoThreatMapProps) => {
  const [selectedPoint, setSelectedPoint] = useState<ThreatPoint | null>(null);
  const [animatingPoints, setAnimatingPoints] = useState<number[]>([]);

  const { incidents: hookEvents } = useRealtimeIncidents(50);
  const events = propEvents || hookEvents || [];

  const threatPoints = useMemo(() => {
    const grouped: Record<string, ThreatPoint> = {};
    events.forEach((e: any) => {
      const ip = e.source_ip;
      if (!ip) return;
      const geo = ipToGeo(ip);
      const key = `${geo.country}-${geo.city}`;
      if (!grouped[key]) {
        grouped[key] = {
          ip,
          ...geo,
          severity: e.severity || "medium",
          type: e.type || e.incident_type || "unknown", // Use 'type' from security_incidents
          count: 0,
        };
      }
      grouped[key].count++;
      if ((e.severity === "critical" || e.severity === "high") && grouped[key].severity !== "critical") {
        grouped[key].severity = e.severity;
      }
    });
    return Object.values(grouped);
  }, [events]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (threatPoints.length > 0) {
        const idx = Math.floor(Math.random() * threatPoints.length);
        setAnimatingPoints((prev) => [...prev, idx]);
        setTimeout(() => setAnimatingPoints((prev) => prev.filter((i) => i !== idx)), 2000);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [threatPoints.length]);

  const W = 460;
  const H = 260;

  const sevColor = (s: string) =>
    s === "critical" ? "hsl(var(--destructive))" : s === "high" ? "hsl(var(--warning, 38 92% 50%))" : "hsl(var(--primary))";

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-semibold text-foreground">GeoIP Threat Map</span>
          <Badge variant="secondary" className="text-[8px]">{threatPoints.length} sources</Badge>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Medium/Low</span>
        </div>
      </div>

      <div className="relative p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 320 }}>
          {/* Grid */}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i * H) / 6} x2={W} y2={(i * H) / 6} stroke="hsl(var(--border))" strokeWidth={0.3} strokeOpacity={0.3} />
          ))}
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`v${i}`} x1={(i * W) / 12} y1={0} x2={(i * W) / 12} y2={H} stroke="hsl(var(--border))" strokeWidth={0.3} strokeOpacity={0.3} />
          ))}

          {/* Continents */}
          {WORLD_PATHS.map((d, i) => (
            <path key={i} d={d} fill="hsl(var(--muted))" fillOpacity={0.3} stroke="hsl(var(--border))" strokeWidth={0.5} />
          ))}

          {/* Attack lines from source to center */}
          {threatPoints.map((p, i) => {
            const pos = project(p.lat, p.lng, W, H);
            const center = project(0, 35, W, H); // Target (our server)
            const isAnimating = animatingPoints.includes(i);
            return (
              <g key={`line-${i}`}>
                {isAnimating && (
                  <line
                    x1={pos.x} y1={pos.y} x2={center.x} y2={center.y}
                    stroke={sevColor(p.severity)} strokeWidth={0.8} strokeOpacity={0.4}
                    strokeDasharray="3,3"
                  >
                    <animate attributeName="stroke-opacity" values="0;0.6;0" dur="2s" />
                  </line>
                )}
              </g>
            );
          })}

          {/* Threat points */}
          {threatPoints.map((p, i) => {
            const pos = project(p.lat, p.lng, W, H);
            const r = Math.min(3 + Math.log2(p.count + 1) * 1.5, 10);
            const isAnimating = animatingPoints.includes(i);
            return (
              <g key={`pt-${i}`} onClick={() => setSelectedPoint(p)} className="cursor-pointer">
                {/* Pulse ring */}
                {isAnimating && (
                  <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke={sevColor(p.severity)} strokeWidth={1}>
                    <animate attributeName="r" from={r.toString()} to={(r * 3).toString()} dur="1.5s" />
                    <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" />
                  </circle>
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={sevColor(p.severity)} fillOpacity={0.6}
                  stroke={sevColor(p.severity)} strokeWidth={0.8}
                />
                <text x={pos.x} y={pos.y - r - 2} textAnchor="middle" fontSize={5} fill="hsl(var(--muted-foreground))" fillOpacity={0.7}>
                  {p.count}
                </text>
              </g>
            );
          })}

          {/* Target marker */}
          {(() => {
            const c = project(0, 35, W, H);
            return (
              <g>
                <circle cx={c.x} cy={c.y} r={4} fill="hsl(var(--primary))" fillOpacity={0.8} stroke="hsl(var(--primary))" strokeWidth={1}>
                  <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={c.x} y={c.y + 12} textAnchor="middle" fontSize={5} fill="hsl(var(--primary))" fontWeight="bold">TARGET</text>
              </g>
            );
          })()}
        </svg>

        {/* Info tooltip */}
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur border border-border rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-semibold text-foreground">{selectedPoint.city}, {selectedPoint.country}</span>
              </div>
              <button onClick={() => setSelectedPoint(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div><span className="text-muted-foreground">IP:</span> <span className="text-foreground">{selectedPoint.ip}</span></div>
              <div><span className="text-muted-foreground">Events:</span> <span className="text-foreground">{selectedPoint.count}</span></div>
              <div><span className="text-muted-foreground">Severity:</span> <Badge variant={selectedPoint.severity === "critical" ? "destructive" : "secondary"} className="text-[8px]">{selectedPoint.severity}</Badge></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GeoThreatMap;
