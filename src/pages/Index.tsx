import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import SecurityLayers from "@/components/SecurityLayers";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import { Shield, AlertTriangle, Activity, Monitor, FileText, Terminal, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Navbar />
      <HeroSection />
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-mono uppercase tracking-[0.3em] text-primary/80 mb-4">Welcome to the AI cyber command center</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-4">A digital-first security operations experience for analysts, operators, and administrators.</h2>
          <p className="text-base text-muted-foreground leading-8 mb-8">
            Before login, this page introduces the platform and its AI-powered intelligence. After sign in, your role determines access to Dashboard, Alerts, Monitoring, Logs, Terminal tools, and Incident Response.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Dashboard", description: "Central command view for live system status and security posture.", icon: Activity },
            { label: "Alert Center", description: "Critical threat alerts and response recommendations in one place.", icon: AlertTriangle },
            { label: "Monitoring", description: "Continuous AI-assisted monitoring of systems, networks and services.", icon: Monitor },
            { label: "Logs", description: "Ordered audit and event logs for full procedure tracking.", icon: FileText },
            { label: "Terminal", description: "Secure operations tools for administrators and operators.", icon: Terminal },
            { label: "Incident Response", description: "Fast triage, investigation, and remediation workflows.", icon: Shield },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{item.label}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
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
