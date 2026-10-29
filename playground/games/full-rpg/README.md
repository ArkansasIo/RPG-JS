# Full RPG Engine

A playable browser RPG prototype included in the RPGJS playground. It demonstrates the core game loop and data-driven gameplay systems in one compact starter: movement, collision, melee combat, enemy AI, health and mana, experience/level progression, loot, gold, inventory, quest tracking, crafting, zone transitions, dialogue, and local save/load.

## Run

From the repository root:

```bash
pnpm playground
```

Select **Full RPG Engine** in the launcher at `http://localhost:5174`. To run it directly:

```bash
pnpm --dir playground/games/full-rpg dev
```

Direct URL: `http://localhost:5189`.

## Controls

- WASD / arrow keys: move
- Space: melee attack
- E: interact with nearby NPCs, enemies, chests, and portals
- I: inventory and equipment
- J: quest journal
- Click Craft: craft a healing tonic from herbs
- Save / Load: local browser save slot

## Implemented prototype systems

- Fixed-step update loop with clamped frame delta
- Tile-like arena collision and zone-specific world state
- Enemy aggro, chase, attack cooldown, death, respawn and loot
- Player HP/MP, attack/defense, XP curve, level-ups and stat growth
- Quest state and objective progress
- Inventory stack counts, gold, consumable healing and equipment upgrades
- Crafting recipes and resource checks
- NPC dialogue and interaction range checks
- Browser local-storage save/load with schema/version guard
- Responsive command-center HUD and event log

This is a runnable starter game/prototype, not a claim that every production MMO requirement (authoritative dedicated servers, anti-cheat, account services, database persistence, matchmaking, shard orchestration, or production deployment) is complete. Those require separate backend and infrastructure work.
