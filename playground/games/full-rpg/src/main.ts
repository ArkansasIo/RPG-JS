import "./style.css";

type ItemId = "herb" | "slime-gel" | "tonic" | "iron-sword" | "hide";
type Item = { id: ItemId; name: string; description: string; count: number; kind: "material" | "consumable" | "weapon" | "armor" };
type Enemy = { id: number; x: number; y: number; hp: number; maxHp: number; alive: boolean; cooldown: number; respawn: number; aggro: boolean };
type ZoneId = "greenwood" | "ruins";
type SaveData = { version: 1; savedAt: number; player: { x: number; y: number; hp: number; mp: number; level: number; xp: number; gold: number; attack: number; defense: number; inventory: Item[]; questStage: number; zone: ZoneId }; enemies: Array<{ id: number; hp: number; alive: boolean; respawn: number }> };

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const ctx = canvas?.getContext("2d");
if (!canvas || !ctx) throw new Error("Canvas is not supported in this browser.");

const W = canvas.width;
const H = canvas.height;
const SAVE_KEY = "rpgjs-full-rpg-save-v1";
const ITEM_DATA: Record<ItemId, Omit<Item, "count">> = {
  herb: { id: "herb", name: "Moonleaf", description: "A fragrant herb used to brew tonics.", kind: "material" },
  "slime-gel": { id: "slime-gel", name: "Slime Gel", description: "A resilient gel dropped by forest slimes.", kind: "material" },
  tonic: { id: "tonic", name: "Healing Tonic", description: "Restores 45 health.", kind: "consumable" },
  "iron-sword": { id: "iron-sword", name: "Iron Sword", description: "A sturdy blade. +5 attack.", kind: "weapon" },
  hide: { id: "hide", name: "Forest Hide", description: "Useful for light armor and trade.", kind: "material" }
};
const keys = new Set<string>();
let lastFrame = 0;
let gameTime = 0;
let toastTimer = 0;
let attackFlash = 0;
let zone: ZoneId = "greenwood";
let modalOpen = false;
let questStage = 0;
let nextEnemyId = 4;
let player = { x: 170, y: 300, radius: 13, hp: 100, maxHp: 100, mp: 40, maxMp: 40, level: 1, xp: 0, gold: 25, attack: 12, defense: 4, speed: 190, attackCooldown: 0, invulnerable: 0 };
let inventory: Item[] = [
  { ...ITEM_DATA.herb, count: 2 },
  { ...ITEM_DATA["slime-gel"], count: 1 },
  { ...ITEM_DATA.tonic, count: 1 }
];
let enemies: Enemy[] = [
  { id: 1, x: 440, y: 240, hp: 35, maxHp: 35, alive: true, cooldown: 0, respawn: 0, aggro: false },
  { id: 2, x: 590, y: 385, hp: 35, maxHp: 35, alive: true, cooldown: 0, respawn: 0, aggro: false },
  { id: 3, x: 720, y: 200, hp: 45, maxHp: 45, alive: true, cooldown: 0, respawn: 0, aggro: false }
];
const npcs = [{ id: "rowan", x: 300, y: 170, name: "Elder Rowan", color: "#8fc9ad" }];
const herbs = [{ x: 510, y: 125, collected: false }, { x: 790, y: 455, collected: false }, { x: 650, y: 105, collected: false }];
const chests = [{ x: 820, y: 330, opened: false }];
const zonePortals = [{ x: 900, y: 530, label: "Ancient Ruins" }];

function el<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required UI element: ${selector}`);
  return node;
}
const toastNode = el<HTMLDivElement>("#toast");
const logList = el<HTMLUListElement>("#log-list");
const modalRoot = el<HTMLDivElement>("#modal-root");

function toast(message: string): void {
  toastNode.textContent = message;
  toastNode.classList.add("show");
  toastTimer = 2.8;
}
function log(message: string): void {
  const item = document.createElement("li");
  item.textContent = message;
  logList.prepend(item);
  while (logList.children.length > 12) logList.lastElementChild?.remove();
}
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function itemCount(id: ItemId): number {
  return inventory.find((item) => item.id === id)?.count ?? 0;
}
function addItem(id: ItemId, amount = 1): void {
  const current = inventory.find((item) => item.id === id);
  if (current) current.count += amount;
  else inventory.push({ ...ITEM_DATA[id], count: amount });
}
function removeItem(id: ItemId, amount = 1): boolean {
  const current = inventory.find((item) => item.id === id);
  if (!current || current.count < amount) return false;
  current.count -= amount;
  if (current.count <= 0) inventory = inventory.filter((item) => item.id !== id);
  return true;
}
function xpRequired(level = player.level): number {
  return Math.floor(100 * Math.pow(level, 1.65));
}
function gainXp(amount: number): void {
  player.xp += amount;
  while (player.xp >= xpRequired()) {
    player.xp -= xpRequired();
    player.level++;
    player.maxHp += 14;
    player.maxMp += 5;
    player.attack += 3;
    player.defense += 1;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    toast(`Level up! You reached level ${player.level}.`);
    log(`Level ${player.level} reached. Your stats increased.`);
  }
}
function setZone(next: ZoneId): void {
  zone = next;
  player.x = next === "ruins" ? 95 : 850;
  player.y = next === "ruins" ? 110 : 470;
  el<HTMLElement>("#zone-label").textContent = next === "ruins" ? "Ancient Ruins" : "Greenwood";
  toast(`Entered ${next === "ruins" ? "the Ancient Ruins" : "Greenwood"}.`);
  log(`Zone changed: ${next === "ruins" ? "Ancient Ruins" : "Greenwood"}.`);
}
function updateHud(): void {
  el<HTMLElement>("#hero-level").textContent = `Level ${player.level} Adventurer`;
  el<HTMLElement>("#hp-text").textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  el<HTMLElement>("#mp-text").textContent = `${Math.ceil(player.mp)} / ${player.maxMp}`;
  el<HTMLElement>("#xp-text").textContent = `${player.xp} / ${xpRequired()} XP`;
  el<HTMLElement>("#hp-bar").style.width = `${Math.max(0, player.hp / player.maxHp * 100)}%`;
  el<HTMLElement>("#mp-bar").style.width = `${Math.max(0, player.mp / player.maxMp * 100)}%`;
  el<HTMLElement>("#xp-bar").style.width = `${player.xp / xpRequired() * 100}%`;
  el<HTMLElement>("#atk-stat").textContent = String(player.attack);
  el<HTMLElement>("#def-stat").textContent = String(player.defense);
  el<HTMLElement>("#gold-stat").textContent = String(player.gold);
  const completed = questStage >= 3;
  el<HTMLElement>("#quest-title").textContent = completed ? "A Quiet Clearing — Complete" : ["A Quiet Clearing", "Trouble in the Woods", "A Herbal Remedy"][questStage];
  el<HTMLElement>("#quest-description").textContent = [
    "Speak with Elder Rowan near the old oak.",
    "Defeat two forest slimes and return to Rowan.",
    "Gather two Moonleaf herbs and craft a Healing Tonic."
  ][Math.min(questStage, 2)] ?? "Quest complete. Keep exploring!";
  el<HTMLElement>("#quest-count").textContent = completed ? "1/1" : `${questStage}/3`;
  el<HTMLElement>("#quest-progress").style.width = `${questStage / 3 * 100}%`;
  el<HTMLElement>("#quest-status").textContent = completed ? "Rewards claimed · +100 XP" : "Active quest";
}
function nearestTarget(): { kind: "npc" | "enemy" | "chest" | "herb" | "portal"; ref: any; distance: number } | null {
  const candidates: Array<{ kind: "npc" | "enemy" | "chest" | "herb" | "portal"; ref: any; distance: number }> = [];
  if (zone === "greenwood") {
    for (const npc of npcs) candidates.push({ kind: "npc", ref: npc, distance: distance(player, npc) });
    for (const enemy of enemies.filter((entry) => entry.alive)) candidates.push({ kind: "enemy", ref: enemy, distance: distance(player, enemy) });
    for (const chest of chests.filter((entry) => !entry.opened)) candidates.push({ kind: "chest", ref: chest, distance: distance(player, chest) });
    for (const herb of herbs.filter((entry) => !entry.collected)) candidates.push({ kind: "herb", ref: herb, distance: distance(player, herb) });
    for (const portal of zonePortals) candidates.push({ kind: "portal", ref: portal, distance: distance(player, portal) });
  } else {
    for (const enemy of ruinsEnemies.filter((entry) => entry.alive)) candidates.push({ kind: "enemy", ref: enemy, distance: distance(player, enemy) });
    candidates.push({ kind: "portal", ref: { x: 55, y: 540, label: "Greenwood" }, distance: distance(player, { x: 55, y: 540 }) });
  }
  return candidates.sort((a, b) => a.distance - b.distance)[0] ?? null;
}
const ruinsEnemies: Enemy[] = [
  { id: 101, x: 340, y: 230, hp: 80, maxHp: 80, alive: true, cooldown: 0, respawn: 0, aggro: false },
  { id: 102, x: 610, y: 360, hp: 80, maxHp: 80, alive: true, cooldown: 0, respawn: 0, aggro: false }
];
function interact(): void {
  const target = nearestTarget();
  if (!target || target.distance > 58) {
    toast("Nothing nearby to interact with.");
    return;
  }
  if (target.kind === "npc") {
    if (questStage === 0) {
      questStage = 1;
      toast("Elder Rowan: Slimes are troubling the forest. Please clear two of them.");
      log("Quest accepted: Trouble in the Woods.");
    } else if (questStage === 1) {
      toast("Elder Rowan: The slimes are still out there. Please defeat two.");
    } else if (questStage === 2) {
      toast("Elder Rowan: Bring me two Moonleaf herbs and brew a tonic.");
    } else {
      toast("Elder Rowan: Greenwood is safer thanks to you. Take this 50 gold.");
      player.gold += 50;
      questStage = 4;
      gainXp(100);
      log("Quest reward: 100 XP and 50 gold.");
    }
  } else if (target.kind === "enemy") {
    attack();
  } else if (target.kind === "chest") {
    target.ref.opened = true;
    player.gold += 35;
    addItem("iron-sword");
    gainXp(20);
    toast("Chest opened: Iron Sword, 35 gold, 20 XP.");
    log("Loot acquired: Iron Sword and 35 gold.");
  } else if (target.kind === "herb") {
    target.ref.collected = true;
    addItem("herb");
    toast("Collected 1 Moonleaf.");
    log("Gathered Moonleaf.");
    if (questStage === 2 && itemCount("herb") >= 2) toast("You have enough herbs. Craft a tonic.");
  } else if (target.kind === "portal") {
    setZone(zone === "greenwood" ? "ruins" : "greenwood");
  }
  updateHud();
}
function attack(): void {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = 0.38;
  attackFlash = 0.18;
  player.mp = Math.max(0, player.mp - 1);
  const mobs = (zone === "greenwood" ? enemies : ruinsEnemies).filter((enemy) => enemy.alive && distance(player, enemy) < 68);
  if (!mobs.length) {
    toast("Your attack misses. Move closer to an enemy.");
    return;
  }
  const enemy = mobs.sort((a, b) => distance(player, a) - distance(player, b))[0];
  const damage = Math.max(1, player.attack + Math.floor(Math.random() * 5) - 2 - Math.floor(player.defense * 0.1));
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.aggro = true;
  toast(`Hit for ${damage} damage.`);
  if (enemy.hp <= 0) {
    enemy.alive = false;
    enemy.respawn = 12;
    player.gold += zone === "ruins" ? 18 : 7;
    addItem(zone === "ruins" ? "hide" : "slime-gel");
    gainXp(zone === "ruins" ? 55 : 30);
    log(`Enemy defeated: +${zone === "ruins" ? 55 : 30} XP, loot, and gold.`);
    if (questStage === 1 && enemies.filter((entry) => !entry.alive).length >= 2) {
      questStage = 2;
      toast("Quest updated: Gather Moonleaf and craft a tonic.");
      log("Quest objective completed. Return to Elder Rowan.");
    }
  }
  updateHud();
}
function openModal(title: string, body: string): void {
  modalRoot.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="modal-head"><h2>${escapeHtml(title)}</h2><button id="modal-close" aria-label="Close">✕</button></header><div class="modal-body">${body}</div></section>`;
  modalRoot.hidden = false;
  modalOpen = true;
  el<HTMLButtonElement>("#modal-close").addEventListener("click", closeModal);
  modalRoot.addEventListener("click", (event) => { if (event.target === modalRoot) closeModal(); }, { once: true });
}
function closeModal(): void {
  modalRoot.hidden = true;
  modalRoot.replaceChildren();
  modalOpen = false;
  canvas.focus();
}
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
function showInventory(): void {
  const rows = inventory.length ? inventory.map((item) => `<div class="list-row"><div><strong>${escapeHtml(item.name)} × ${item.count}</strong><p>${escapeHtml(item.description)}</p></div><div><span class="tag">${item.kind}</span>${item.kind === "consumable" ? ` <button data-use="${item.id}">Use</button>` : item.kind === "weapon" ? ` <button data-equip="${item.id}">Equip</button>` : ""}</div></div>`).join("") : '<div class="empty">Your inventory is empty.</div>';
  openModal("Inventory & Equipment", `${rows}<div class="modal-actions"><button data-action="craft">Craft Healing Tonic (2 Moonleaf)</button></div>`);
  modalRoot.querySelectorAll<HTMLButtonElement>("[data-use]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.use as ItemId;
    if (id === "tonic" && removeItem("tonic")) { player.hp = Math.min(player.maxHp, player.hp + 45); toast("Healing Tonic restored health."); log("Used Healing Tonic."); updateHud(); showInventory(); }
  }));
  modalRoot.querySelectorAll<HTMLButtonElement>("[data-equip]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.equip === "iron-sword") { player.attack += 5; removeItem("iron-sword"); toast("Iron Sword equipped: +5 attack."); log("Equipped Iron Sword."); updateHud(); showInventory(); }
  }));
  modalRoot.querySelectorAll<HTMLButtonElement>('[data-action="craft"]').forEach((button) => button.addEventListener("click", () => craft()));
}
function showQuests(): void {
  const steps = [
    ["Talk to Elder Rowan", questStage >= 1],
    ["Defeat two forest slimes", questStage >= 2],
    ["Gather Moonleaf and craft a tonic", questStage >= 3],
    ["Return to Rowan for your reward", questStage >= 4]
  ];
  openModal("Quest Journal", `<p>Current story: <strong>A Quiet Clearing</strong></p>${steps.map(([label, done]) => `<div class="list-row"><span>${label}</span><span class="tag">${done ? "Complete" : "Pending"}</span></div>`).join("")}<p>Quest progress is stored in your save slot.</p>`);
}
function craft(): void {
  if (itemCount("herb") < 2) { toast("Need 2 Moonleaf to craft a Healing Tonic."); return; }
  if (!removeItem("herb", 2)) return;
  addItem("tonic");
  if (questStage === 2) questStage = 3;
  toast("Crafted 1 Healing Tonic.");
  log("Crafting complete: Healing Tonic.");
  updateHud();
  if (modalOpen) showInventory();
}
function showCrafting(): void {
  openModal("Crafting Bench", `<div class="list-row"><div><strong>Healing Tonic</strong><p>Restores 45 HP. Recipe: 2 Moonleaf.</p></div><button id="craft-tonic">Craft</button></div><div class="list-row"><div><strong>Field Rations</strong><p>Restores 15 MP. Recipe: 1 Slime Gel.</p></div><button id="craft-rations">Craft</button></div>`);
  el<HTMLButtonElement>("#craft-tonic").addEventListener("click", craft);
  el<HTMLButtonElement>("#craft-rations").addEventListener("click", () => {
    if (!removeItem("slime-gel")) { toast("Need 1 Slime Gel."); return; }
    player.mp = Math.min(player.maxMp, player.mp + 15);
    toast("Converted Slime Gel into 15 MP.");
    updateHud();
    showCrafting();
  });
}
function showMap(): void {
  openModal("World Map", `<div class="list-row"><div><strong>Greenwood</strong><p>Safe clearing, Elder Rowan, gathering and forest slimes.</p></div><span class="tag">${zone === "greenwood" ? "Current zone" : "Travel"}</span></div><div class="list-row"><div><strong>Ancient Ruins</strong><p>Higher-level guardians and improved rewards.</p></div><button id="travel-ruins">${zone === "ruins" ? "Current zone" : "Travel"}</button></div>`);
  el<HTMLButtonElement>("#travel-ruins").addEventListener("click", () => { if (zone !== "ruins") setZone("ruins"); closeModal(); });
}
function saveGame(): void {
  const data: SaveData = {
    version: 1, savedAt: Date.now(),
    player: { x: player.x, y: player.y, hp: player.hp, mp: player.mp, level: player.level, xp: player.xp, gold: player.gold, attack: player.attack, defense: player.defense, inventory, questStage, zone },
    enemies: [...enemies, ...ruinsEnemies].map(({ id, hp, alive, respawn }) => ({ id, hp, alive, respawn }))
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    el<HTMLElement>("#save-status").textContent = "saved";
    toast("Game saved in this browser.");
    log("Save slot updated.");
  } catch {
    toast("Save failed. Browser storage may be disabled.");
  }
}
function loadGame(): void {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { toast("No save found. Use Save first."); return; }
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1 || !data.player || !Array.isArray(data.player.inventory)) throw new Error("Unsupported save format");
    Object.assign(player, data.player);
    inventory = data.player.inventory.filter((item) => ITEM_DATA[item.id] && Number.isFinite(item.count) && item.count > 0);
    questStage = Number.isFinite(data.player.questStage) ? data.player.questStage : 0;
    zone = data.player.zone === "ruins" ? "ruins" : "greenwood";
    for (const saved of data.enemies ?? []) {
      const enemy = [...enemies, ...ruinsEnemies].find((entry) => entry.id === saved.id);
      if (enemy) Object.assign(enemy, { hp: saved.hp, alive: saved.alive, respawn: saved.respawn });
    }
    el<HTMLElement>("#zone-label").textContent = zone === "ruins" ? "Ancient Ruins" : "Greenwood";
    el<HTMLElement>("#save-status").textContent = "saved";
    updateHud();
    toast("Save loaded.");
    log("Save slot loaded.");
  } catch {
    toast("Save data is invalid or from an incompatible version.");
  }
}
function resetGame(): void {
  if (!confirm("Reset this adventure? This clears your local save and current progress.")) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}
function updateEnemies(dt: number): void {
  for (const enemy of [...enemies, ...ruinsEnemies]) {
    if (!enemy.alive) {
      enemy.respawn -= dt;
      if (enemy.respawn <= 0) { enemy.alive = true; enemy.hp = enemy.maxHp; enemy.aggro = false; }
      continue;
    }
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);
    if (zone === "greenwood" && !enemies.includes(enemy) || zone === "ruins" && !ruinsEnemies.includes(enemy)) continue;
    const d = distance(player, enemy);
    if (d < 210) enemy.aggro = true;
    if (!enemy.aggro) continue;
    if (d > 31) {
      const dx = (player.x - enemy.x) / Math.max(1, d);
      const dy = (player.y - enemy.y) / Math.max(1, d);
      enemy.x = Math.max(38, Math.min(W - 38, enemy.x + dx * (zone === "ruins" ? 70 : 58) * dt));
      enemy.y = Math.max(38, Math.min(H - 38, enemy.y + dy * (zone === "ruins" ? 70 : 58) * dt));
    } else if (enemy.cooldown <= 0 && player.invulnerable <= 0) {
      const damage = Math.max(2, (zone === "ruins" ? 13 : 8) - player.defense);
      player.hp = Math.max(0, player.hp - damage);
      player.invulnerable = 0.7;
      enemy.cooldown = 1.1;
      toast(`You took ${damage} damage.`);
      if (player.hp <= 0) {
        player.hp = Math.ceil(player.maxHp * 0.6);
        player.gold = Math.max(0, player.gold - 10);
        player.x = zone === "ruins" ? 95 : 170;
        player.y = zone === "ruins" ? 110 : 300;
        toast("You were rescued and revived. 10 gold lost.");
        log("You fell in battle and were revived at the zone entrance.");
      }
      updateHud();
    }
  }
}
function draw(): void {
  const c = ctx!;
  c.clearRect(0, 0, W, H);
  c.fillStyle = zone === "ruins" ? "#24262d" : "#18382d";
  c.fillRect(0, 0, W, H);
  // Subtle world grid and terrain patches.
  c.strokeStyle = zone === "ruins" ? "#393b42" : "#234b3a";
  c.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y <= H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  for (let i = 0; i < 24; i++) {
    const x = (i * 137 + 31) % W; const y = (i * 83 + 47) % H;
    c.fillStyle = zone === "ruins" ? "#4a4740" : "#204b36";
    c.beginPath(); c.ellipse(x, y, 18 + (i % 4) * 3, 10 + (i % 3) * 2, i * 0.3, 0, Math.PI * 2); c.fill();
  }
  if (zone === "greenwood") {
    // Old oak
    c.fillStyle = "#67472e"; c.fillRect(266, 106, 18, 58);
    c.fillStyle = "#2b7148"; c.beginPath(); c.arc(275, 100, 38, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#398456"; c.beginPath(); c.arc(254, 112, 22, 0, Math.PI * 2); c.fill();
    drawLabel("Elder Rowan", 300, 151, "#a4e3c0");
    for (const herb of herbs.filter((h) => !h.collected)) { c.fillStyle = "#b6e16b"; c.beginPath(); c.arc(herb.x, herb.y, 6, 0, Math.PI * 2); c.fill(); c.fillStyle = "#e0f6a7"; c.fillRect(herb.x - 1, herb.y - 10, 2, 8); }
    for (const chest of chests.filter((ch) => !ch.opened)) { c.fillStyle = "#96632e"; c.fillRect(chest.x - 12, chest.y - 8, 24, 18); c.fillStyle = "#e4bd65"; c.fillRect(chest.x - 12, chest.y - 2, 24, 4); c.fillStyle = "#f2d88e"; c.fillRect(chest.x - 2, chest.y - 1, 4, 6); }
    for (const portal of zonePortals) { c.fillStyle = "#7e67c9"; c.beginPath(); c.ellipse(portal.x, portal.y, 23, 34, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#b8a9ff"; c.beginPath(); c.ellipse(portal.x, portal.y, 12, 25, 0, 0, Math.PI * 2); c.fill(); drawLabel(portal.label, portal.x, portal.y + 45, "#d5caff"); }
    for (const npc of npcs) { c.fillStyle = npc.color; c.beginPath(); c.arc(npc.x, npc.y, 13, 0, Math.PI * 2); c.fill(); c.fillStyle = "#d9f6e6"; c.fillRect(npc.x - 5, npc.y - 4, 10, 8); c.fillStyle = "#6b9b7e"; c.fillRect(npc.x - 7, npc.y + 9, 14, 10); }
  } else {
    for (const i of [0, 1, 2, 3, 4]) { c.strokeStyle = "#66665c"; c.lineWidth = 8; c.strokeRect(120 + i * 125, 80 + (i % 2) * 55, 70, 65); }
    c.fillStyle = "#7b6e9d"; c.beginPath(); c.arc(55, 540, 23, 0, Math.PI * 2); c.fill(); drawLabel("Greenwood", 55, 575, "#d5caff");
  }
  const activeEnemies = zone === "greenwood" ? enemies : ruinsEnemies;
  for (const enemy of activeEnemies) {
    if (!enemy.alive) continue;
    c.fillStyle = zone === "ruins" ? "#9b776d" : "#8acb78";
    c.beginPath(); c.arc(enemy.x, enemy.y, zone === "ruins" ? 18 : 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#243026"; c.beginPath(); c.arc(enemy.x - 4, enemy.y - 2, 2, 0, Math.PI * 2); c.arc(enemy.x + 4, enemy.y - 2, 2, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#101820"; c.fillRect(enemy.x - 20, enemy.y - 27, 40, 5);
    c.fillStyle = "#e2606d"; c.fillRect(enemy.x - 20, enemy.y - 27, 40 * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }
  if (attackFlash > 0) { c.strokeStyle = "#ffe59b"; c.lineWidth = 4; c.beginPath(); c.arc(player.x, player.y, 36, -0.9, 1.2); c.stroke(); }
  c.fillStyle = player.invulnerable > 0 ? "#e4f4ff" : "#75baff";
  c.beginPath(); c.arc(player.x, player.y, player.radius, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#142c46"; c.beginPath(); c.arc(player.x - 4, player.y - 3, 2, 0, Math.PI * 2); c.arc(player.x + 4, player.y - 3, 2, 0, Math.PI * 2); c.fill();
  const target = nearestTarget();
  if (target && target.distance < 65) { c.strokeStyle = "#e9d28a"; c.setLineDash([4, 4]); c.beginPath(); c.arc(target.ref.x, target.ref.y, 25, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); c.fillStyle = "#f6e7b0"; c.font = "12px sans-serif"; c.textAlign = "center"; c.fillText("E · Interact", target.ref.x, target.ref.y - 35); }
  const vignette = c.createRadialGradient(W / 2, H / 2, 130, W / 2, H / 2, 620);
  vignette.addColorStop(0, "#00000000"); vignette.addColorStop(1, "#03090d55"); c.fillStyle = vignette; c.fillRect(0, 0, W, H);
}
function drawLabel(text: string, x: number, y: number, color: string): void {
  ctx!.font = "12px sans-serif"; ctx!.textAlign = "center"; ctx!.fillStyle = "#09120dcc"; ctx!.fillRect(x - 45, y - 15, 90, 18); ctx!.fillStyle = color; ctx!.fillText(text, x, y - 2);
}
function update(dt: number): void {
  gameTime += dt;
  toastTimer = Math.max(0, toastTimer - dt);
  if (!toastTimer) toastNode.classList.remove("show");
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  attackFlash = Math.max(0, attackFlash - dt);
  if (!modalOpen) {
    let dx = 0; let dy = 0;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;
    const length = Math.hypot(dx, dy) || 1;
    player.x = Math.max(28, Math.min(W - 28, player.x + dx / length * player.speed * dt));
    player.y = Math.max(28, Math.min(H - 28, player.y + dy / length * player.speed * dt));
    updateEnemies(dt);
  }
}
function frame(time: number): void {
  const dt = Math.min(0.05, (time - (lastFrame || time)) / 1000);
  lastFrame = time;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
function runAction(actionName: string): void {
  switch (actionName) {
    case "attack": attack(); break;
    case "interact": interact(); break;
    case "inventory": showInventory(); break;
    case "quests": showQuests(); break;
    case "craft": showCrafting(); break;
    case "map": showMap(); break;
  }
}
document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => button.addEventListener("click", () => runAction(button.dataset.action ?? "")));
el<HTMLButtonElement>("#save-btn").addEventListener("click", saveGame);
el<HTMLButtonElement>("#load-btn").addEventListener("click", loadGame);
el<HTMLButtonElement>("#reset-btn").addEventListener("click", resetGame);
el<HTMLButtonElement>("#clear-log").addEventListener("click", () => { logList.replaceChildren(); log("Log cleared."); });
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (modalOpen && key === "escape") { closeModal(); return; }
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) keys.add(key);
  if (event.repeat) return;
  if (key === " ") attack();
  if (key === "e") interact();
  if (key === "i") { if (modalOpen) closeModal(); else showInventory(); }
  if (key === "j") { if (modalOpen) closeModal(); else showQuests(); }
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
el<HTMLElement>("#save-status").textContent = "local";
updateHud();
log("Find Elder Rowan beside the old oak to begin your first quest.");
log("Tip: slimes become aggressive when you approach.");
requestAnimationFrame(frame);
