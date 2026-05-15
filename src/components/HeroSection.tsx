import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Activity, Lock, ChevronDown, Radar } from "lucide-react";
import heroBg from "@/assets/hero-cyber.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Cybersecurity command center" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
      </div>

      {/* Grid + dots overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-dots opacity-20" />

      {/* Animated glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]"
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 mb-8 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm"
        >
          <Radar className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-mono text-xs tracking-[0.25em] uppercase text-primary/80">
            Ruaha Catholic University · ICT Faculty
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.95] mb-8 tracking-tight"
        >
          <span className="text-foreground">Unified</span>
          <br />
          <span className="text-primary text-glow">Cyber Security</span>
          <br />
          <span className="text-foreground/80">Framework</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Integrating <span className="text-foreground font-medium">System</span>, <span className="text-foreground font-medium">Web</span> & <span className="text-foreground font-medium">Network</span> Security 
          into a single intelligent platform for real-time threat detection and coordinated response.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/login"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:box-glow-strong transition-all duration-300 hover:scale-[1.02]"
          >
            <Activity className="w-4 h-4" />
            Get Started
          </Link>
          <a
            href="#architecture"
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-primary/25 text-primary font-medium text-sm hover:bg-primary/10 hover:border-primary/40 transition-all duration-300"
          >
            <Lock className="w-4 h-4" />
            Architecture
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] text-muted-foreground/50 tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4 text-primary/40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
