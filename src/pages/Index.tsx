import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import SecurityLayers from "@/components/SecurityLayers";
import ThreatAlerts from "@/components/ThreatAlerts";
import EventTimeline from "@/components/EventTimeline";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import MethodologySection from "@/components/MethodologySection";
import ProjectInfo from "@/components/ProjectInfo";
import { Shield, Terminal, ExternalLink } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <SecurityLayers />
      <ThreatAlerts />
      <EventTimeline />
      <ArchitectureDiagram />
      <MethodologySection />
      <ProjectInfo />

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
                  Unified Cybersecurity Framework
                </span>
                <span className="text-[10px] text-muted-foreground/40">
                  Final Year Project · Computer Science
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/40 font-mono">
              © 2026 Ruaha Catholic University — Faculty of ICT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
