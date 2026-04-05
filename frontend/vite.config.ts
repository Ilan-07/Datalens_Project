import path from "node:path";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "next/link": path.resolve(__dirname, "src/compat/next/link.tsx"),
        "next/navigation": path.resolve(__dirname, "src/compat/next/navigation.ts"),
        "next/dynamic": path.resolve(__dirname, "src/compat/next/dynamic.tsx"),
      },
    },
    define: {
      "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(
        env.VITE_API_URL || "http://localhost:8000"
      ),
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
    },
  };
});
