import { useState, useEffect } from "react";
import { Shield, Menu, X, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Dashboard", href: "#dashboard" },
  { label: "Alerts", href: "#alerts" },
  { label: "Timeline", href: "#timeline" },
  { label: "Architecture", href: "#architecture" },
  { label: "Methodology", href: "#methodology" },
  { label: "About", href: "#about" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_30px_hsl(170_100%_45%/0.05)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between h-16">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative">
            <Shield className="w-6 h-6 text-primary transition-all group-hover:drop-shadow-[0_0_8px_hsl(170_100%_45%/0.5)]" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-primary/50" />
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-muted-foreground group-hover:text-primary transition-colors">
              UCSF
            </span>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-0.5 bg-muted/30 rounded-full px-1.5 py-1 border border-border/50">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleClick(link.href)}
              className="px-3.5 py-1.5 text-[11px] font-mono text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-full"
            >
              {link.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/98 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleClick(link.href)}
                  className="text-left px-4 py-2.5 text-sm font-mono text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                >
                  <span className="text-primary/40 mr-2">0{i + 1}</span>
                  {link.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
