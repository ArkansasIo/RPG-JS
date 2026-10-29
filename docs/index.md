---
layout: home
title: RPGJS — Build RPGs and MMORPGs
titleTemplate: Open-source browser RPG engine
hero:
  name: RPGJS
  text: Build an RPG once. Run it as an MMORPG.
  tagline: An open-source TypeScript framework for 2D RPGs and MMORPGs in the browser. Build maps, gameplay, interfaces and multiplayer systems with one codebase.
  actions:
    - theme: brand
      text: Play the Browser Demo
      link: /browser-rpg/
    - theme: alt
      text: Get Started
      link: /guide/get-started
    - theme: alt
      text: View Source on GitHub
      link: https://github.com/ArkansasIo/RPG-JS
features:
  - icon: 🗺️
    title: Worlds and maps
    details: Build tile-based maps, world maps, events, weather, lighting and day/night systems. Import maps with Tiled.
    link: /guide/world-maps
    linkText: Explore world maps
  - icon: ⚔️
    title: RPG gameplay
    details: Create characters, movement, items, skills, combat, dialogs, quests and save/load flows using TypeScript.
    link: /guide/get-started
    linkText: Start building
  - icon: 🌐
    title: RPG or MMORPG
    details: Use the same core architecture for standalone play or synchronized multiplayer worlds with server-owned game state.
    link: /guide/synchronization
    linkText: Learn about synchronization
  - icon: 🧩
    title: Extensible by design
    details: Extend the engine with modules, plugins, client/server hooks and custom GUI integrations.
    link: /guide/create-module
    linkText: Build a module
  - icon: 🎨
    title: Custom interfaces
    details: Add dialogs, menus, HUD elements and GUI overlays to match the look and feel of your game.
    link: /gui/engine-injection
    linkText: Explore GUI
  - icon: 🛠️
    title: TypeScript-first workflow
    details: Work with modern JavaScript tooling, Vite, test helpers and a source-first project you can inspect and modify.
    link: /guide/get-started
    linkText: Read the quick start
---

## Your first game in a few minutes

Create a starter project, install its dependencies, and launch the development server.

```bash
npx degit rpgjs/starter#v5 my-rpg-game
cd my-rpg-game
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The starter launches in MMORPG mode by default. To run standalone RPG mode, set `RPG_TYPE=rpg` when starting the dev server.

## Try the original RPGJS browser example

The live demo on this site is built from the repository's original `playground/games/dash` example and RPGJS workspace packages—not a separate mockup.

[**Launch the browser demo →**](/browser-rpg/)

## Explore the engine

- **[Getting started](/guide/get-started)** — understand the runtime and create your first project.
- **[Project structure](/guide/structure)** — learn how client and server code fit together.
- **[Create your first map](/guide/create-your-first-map)** — start building a world.
- **[Create a hero](/guide/create-hero-in-map)** — put a controllable character on the map.
- **[GUI and interfaces](/gui/engine-injection)** — connect a custom interface to the engine.
- **[API reference](/api)** — browse the available APIs.
- **[Studio documentation](/studio/index)** — explore the Studio integration documentation available in this repository.

## Open source and community

RPGJS is an open-source engine. Read the code, adapt it to your project, and deploy your game on infrastructure you control.

- [GitHub repository](https://github.com/ArkansasIo/RPG-JS)
- [Report an issue](https://github.com/ArkansasIo/RPG-JS/issues)
- [Official RPGJS website](https://rpgjs.dev)
- [RPGJS v5 documentation](https://v5.rpgjs.dev)
