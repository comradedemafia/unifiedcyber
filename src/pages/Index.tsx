import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import SecurityLayers from "@/components/SecurityLayers";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import { Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Navbar />
      <HeroSection />
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-primary/80 mb-4">Welcome to the AI cyber command center</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-4">A digital-first security operations experience for analysts, operators, and administrators.</h2>
          <p className="text-base text-muted-foreground leading-8">
            Before login, this page introduces the system and its AI-powered monitoring intelligence. After sign in, your role controls which panels and controls become available inside the secure platform.
          </p>
        </div>
      </section>
      <StatsBar />
      <SecurityLayers />
      <ArchitectureDiagram />

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
              © 2026 Ruaha Catholic University · Sign in to access live operational tools
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
