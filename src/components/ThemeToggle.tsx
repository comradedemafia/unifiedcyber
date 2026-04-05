import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("ucsf-theme");
    if (saved === "light") {
      setIsDark(false);
      document.documentElement.classList.add("light-mode");
    }
  }, []);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove("light-mode");
        localStorage.setItem("ucsf-theme", "dark");
      } else {
        document.documentElement.classList.add("light-mode");
        localStorage.setItem("ucsf-theme", "light");
      }
      return next;
    });
  };

  return (
    <button
      onClick={toggle}
      className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180, scale: [1, 0.8, 1] }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
