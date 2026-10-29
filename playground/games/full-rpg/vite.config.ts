import { defineConfig } from "vite";
import playgroundConfig from "./playground.config.json";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/RPG-JS/full-rpg/" : "/",
  server: {
    port: playgroundConfig.port,
    strictPort: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
}));
