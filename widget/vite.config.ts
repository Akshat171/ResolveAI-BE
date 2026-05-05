import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: "src/index.tsx",
      name: "ResolvAI",
      fileName: () => "resolvai.js",
      formats: ["iife"],
    },
    outDir: "dist",
    minify: "terser",
    cssCodeSplit: false,
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
