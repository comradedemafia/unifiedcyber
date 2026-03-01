import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import SecurityLayers from "@/components/SecurityLayers";
import LiveThreatFeed from "@/components/LiveThreatFeed";
import LiveMonitoring from "@/components/LiveMonitoring";
import LiveLogStream from "@/components/LiveLogStream";
import SecurityTerminal from "@/components/SecurityTerminal";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import { Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <SecurityLayers />
      <LiveThreatFeed />
      <LiveMonitoring />
      <LiveLogStream />
      <SecurityTerminal />
      <ArchitectureDiagram />

      {/* Footer */}
      <footer className="relative py-12 border-t border-border/30">
        <div className="absolute inset-0 bg-dots opacity-5" />
        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/8 border border-primary/10">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase block">
                  Unified Cyber Security Framework
                </span>
                <span className="text-[10px] text-muted-foreground/40">
                  RUCU · Faculty of ICT · Computer Science
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/40 font-mono">
              © 2026 Ruaha Catholic University
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
