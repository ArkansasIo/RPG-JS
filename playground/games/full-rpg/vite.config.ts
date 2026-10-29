import { defineConfig } from "vite";
import playgroundConfig from "./playground.config.json";

export default defineConfig({
  server: {
    port: playgroundConfig.port,
    strictPort: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
