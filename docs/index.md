---
title: "Quick Start"
description: "Create and run your first RPGJS project in a few minutes."
---

# Quick Start

Use the starter, install dependencies, and launch the dev server:

```bash
npx degit rpgjs/starter#v5 my-rpg-game
cd my-rpg-game
npm install
npm run dev
```

Open `http://localhost:5173`.

## Choose MMORPG or standalone RPG

By default, the starter runs in MMORPG mode.

For standalone RPG mode, start the dev server with `RPG_TYPE=rpg`:

```bash
RPG_TYPE=rpg npm run dev
```

On Windows, use `cross-env`:

```bash
npm install --save-dev cross-env
npx cross-env RPG_TYPE=rpg npm run dev
```

## Play the full RPG prototype

Try the browser-based RPG systems demo with movement, combat, enemy AI, quests, loot, inventory, crafting, progression, world zones, and save/load:

[Launch Full RPG Engine](https://arkansasio.github.io/RPG-JS/full-rpg/)

The prototype is also available in the local playground with `pnpm playground`.

## Next steps

- [Getting Started](/guide/get-started)
- [Structure](/guide/structure)
- [Create your first map](/guide/create-your-first-map)
- [Create hero in map](/guide/create-hero-in-map)
- [API overview](/api)
- [Studio overview](/studio/index)
- [GitHub repository](https://github.com/ArkansasIo/RPG-JS)
