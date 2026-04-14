import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

const getInitialTheme = () => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("ucsf-theme") !== "light";
};

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
    }
  }, [isDark]);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("ucsf-theme", next ? "dark" : "light");
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
