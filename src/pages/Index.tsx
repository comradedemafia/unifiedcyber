import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import SecurityLayers from "@/components/SecurityLayers";
import ThreatAlerts from "@/components/ThreatAlerts";
import EventTimeline from "@/components/EventTimeline";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import ProjectInfo from "@/components/ProjectInfo";
import { Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <StatsBar />
      <SecurityLayers />
      <ThreatAlerts />
      <EventTimeline />
      <ArchitectureDiagram />
      <ProjectInfo />

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs">UNIFIED CYBERSEC FRAMEWORK</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 Ruaha Catholic University — Faculty of ICT
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
