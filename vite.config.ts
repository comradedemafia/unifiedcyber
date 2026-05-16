import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/bun.lock',
        '**/bun.lockb',
        '**/*.md',
        '**/*.sh',
        '**/*.lock',
        '**/*.toml',
        '**/*.yml',
        '**/*.yaml',
      ],
      usePolling: true,
      interval: 1000,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-utils': ['framer-motion', 'date-fns', 'zod', 'clsx', 'tailwind-merge'],
          
          // Feature-specific chunks
          'charts': ['recharts'],
          'pdf': ['jspdf', 'jspdf-autotable'],
          'notifications': ['sonner'],
          
          // Page components
          'pages-dashboard': ['./src/pages/Dashboard.tsx'],
          'pages-siem': ['./src/pages/SIEM.tsx'],
          'pages-login': ['./src/pages/Login.tsx'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
}));
