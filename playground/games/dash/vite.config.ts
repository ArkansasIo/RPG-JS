import { defineConfig } from "vite";
import { rpgjs } from "@rpgjs/vite";
import startServer from "./src/server";
import playgroundConfig from "./playground.config.json";

export default defineConfig({
  // Keep local development at the site root, but prefix production assets
  // with the repository path used by GitHub Pages.
  base: process.env.GITHUB_PAGES === "true" ? "/RPG-JS/browser-rpg/" : "/",
  server: {
    port: playgroundConfig.port,
    strictPort: true,
  },
  plugins: [
    ...rpgjs({
      server: startServer,
      entryPoints: {
        mmorpg: {
          client: "./src/client.ts",
          server: "./src/server.ts",
        },
      },
    }),
  ],
});
