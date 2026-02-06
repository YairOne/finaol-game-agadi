import { Application, Container, Graphics } from "pixi.js";
import { io, Socket } from "socket.io-client";
import { createNpcSprite } from "./npcSprites";
import { GameUI } from "./ui";
import { BaseSnapshot, NpcMode, NpcSnapshot, PlayerState, TileSnapshot } from "./types";

const serverUrl =
  import.meta.env.VITE_SERVER_URL ??
  `${window.location.protocol}//${window.location.hostname}:3001`;
const socket: Socket = io(serverUrl);

const uiRoot = document.querySelector("#ui") as HTMLElement;
const topBar = document.querySelector("#top-bar") as HTMLElement;
const canvasContainer = document.querySelector("#canvas-container") as HTMLElement;

const app = new Application({
  resizeTo: canvasContainer,
  backgroundColor: 0x0b0f19,
  antialias: true
});
canvasContainer.appendChild(app.view as HTMLCanvasElement);

const world = new Container();
const tileLayer = new Container();
const npcLayer = new Container();
const baseLayer = new Container();
world.addChild(tileLayer, baseLayer, npcLayer);
app.stage.addChild(world);

window.addEventListener("resize", () => {
  centerWorld();
});

const ui = new GameUI(uiRoot, topBar, {
  onOpenBox: () => socket.emit("openBox"),
  onPlaceNpc: (slotIndex, inventoryId) => socket.emit("placeNpc", { slotIndex, inventoryId }),
  onToggleNpc: (npcId, mode) => socket.emit("setNpcMode", { npcId, mode })
});

socket.on("connect", () => {
  ui.setStatus("Connected. Loading game state...");
});

socket.on("connect_error", () => {
  ui.setStatus(`Unable to reach server at ${serverUrl}. Make sure it is running.`);
});

socket.on("disconnect", () => {
  ui.setStatus("Disconnected from server. Retrying...");
});

let playerId: string | null = null;
let playerState: PlayerState | null = null;
let playersList: Array<{ id: string; name: string }> = [];
let bases: Record<string, BaseSnapshot> = {};
let tiles: Record<string, TileSnapshot> = {};
const tileGraphics = new Map<string, Graphics>();
const tileProgress = new Map<string, Graphics>();
const baseGraphics = new Map<string, Graphics>();
const baseBars = new Map<string, Graphics>();
const npcSprites = new Map<string, { container: Container; update: (dt: number) => void }>();
const npcModes: Record<string, NpcMode> = {};

const rarityColors: Record<string, number> = {
  COMMON: 0xbdbdbd,
  UNCOMMON: 0x4caf50,
  RARE: 0x42a5f5,
  EPIC: 0xab47bc,
  LEGENDARY: 0xffb300,
  MYTHIC: 0xec407a,
  SECRET: 0x00e5ff
};

const drawPentagon = (g: Graphics, x: number, y: number, radius: number) => {
  const points: number[] = [];
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    points.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  g.drawPolygon(points);
};

const centerWorld = () => {
  const tileValues = Object.values(tiles);
  if (!tileValues.length) return;
  const minX = Math.min(...tileValues.map((t) => t.x));
  const maxX = Math.max(...tileValues.map((t) => t.x));
  const minY = Math.min(...tileValues.map((t) => t.y));
  const maxY = Math.max(...tileValues.map((t) => t.y));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  world.x = app.renderer.width / 2 - midX;
  world.y = app.renderer.height / 2 - midY;
};

const updateTileVisual = (tile: TileSnapshot) => {
  const baseColor = tile.ownerPlayerId ? 0x1e3a8a : 0x374151;
  const ownerTint = tile.ownerPlayerId
    ? rarityColors["COMMON"]
    : baseColor;
  const g = tileGraphics.get(tile.id);
  if (!g) return;
  g.clear();
  g.lineStyle(1.5, 0x1f2937, 0.9);
  g.beginFill(tile.ownerPlayerId ? ownerTint : baseColor);
  drawPentagon(g, tile.x, tile.y, 32);
  g.endFill();
  if (tile.protectedByPlayerId) {
    g.lineStyle(2, 0xfbbf24, 0.9);
    drawPentagon(g, tile.x, tile.y, 35);
  }

  const progress = tileProgress.get(tile.id);
  if (!progress) return;
  progress.clear();
  if (tile.captureProgress > 0) {
    progress.lineStyle(3, 0x38bdf8, 0.9);
    progress.drawCircle(tile.x, tile.y, 18 + tile.captureProgress * 12);
  }
};

const updateBaseVisual = (base: BaseSnapshot) => {
  const core = baseGraphics.get(base.id);
  const bar = baseBars.get(base.id);
  if (!core || !bar) return;
  core.clear();
  core.beginFill(0x111827).drawCircle(base.x, base.y, 26).endFill();
  core.lineStyle(2, 0x60a5fa, 0.9).drawCircle(base.x, base.y, 28);

  bar.clear();
  const hpRatio = Math.max(0, base.coreHp) / base.coreMaxHp;
  bar.beginFill(0x1f2937).drawRoundedRect(base.x - 30, base.y - 42, 60, 6, 3).endFill();
  bar.beginFill(0x22c55e).drawRoundedRect(base.x - 30, base.y - 42, 60 * hpRatio, 6, 3).endFill();
};

const ensureNpcSprite = (npc: NpcSnapshot) => {
  let entry = npcSprites.get(npc.id);
  if (!entry) {
    const visual = createNpcSprite(npc.rarity, npc.id.length * 7);
    visual.container.position.set(npc.x, npc.y);
    visual.container.scale.set(1.1);
    npcLayer.addChild(visual.container);
    entry = { container: visual.container, update: visual.update };
    npcSprites.set(npc.id, entry);
  }
  entry.container.position.set(npc.x, npc.y);
  return entry;
};

const syncNpcSprites = (npcSnapshot: Record<string, NpcSnapshot>) => {
  const ids = new Set(Object.keys(npcSnapshot));
  for (const [id, sprite] of npcSprites) {
    if (!ids.has(id)) {
      sprite.container.destroy({ children: true });
      npcSprites.delete(id);
    }
  }

  for (const npc of Object.values(npcSnapshot)) {
    npcModes[npc.id] = npc.mode;
    ensureNpcSprite(npc);
  }
  ui.setNpcModes(npcModes);
};

const updateTopBar = () => {
  const counts = new Map<string, number>();
  for (const tile of Object.values(tiles)) {
    if (tile.ownerPlayerId) {
      counts.set(tile.ownerPlayerId, (counts.get(tile.ownerPlayerId) ?? 0) + 1);
    }
  }
  const players = playersList.map((player) => ({
    name: player.name,
    tiles: counts.get(player.id) ?? 0
  }));
  ui.updateTopBar(players.sort((a, b) => b.tiles - a.tiles));
};

socket.on("init", (payload: { playerId: string; tiles: Record<string, TileSnapshot>; bases: Record<string, BaseSnapshot>; npcs: Record<string, NpcSnapshot>; players: Array<{ id: string; name: string }> }) => {
  playerId = payload.playerId;
  tiles = payload.tiles;
  bases = payload.bases;
  playersList = payload.players;

  tileLayer.removeChildren();
  baseLayer.removeChildren();
  tileGraphics.clear();
  tileProgress.clear();
  baseGraphics.clear();
  baseBars.clear();

  for (const tile of Object.values(tiles)) {
    const g = new Graphics();
    const p = new Graphics();
    tileGraphics.set(tile.id, g);
    tileProgress.set(tile.id, p);
    tileLayer.addChild(g, p);
    updateTileVisual(tile);
  }

  for (const base of Object.values(bases)) {
    const g = new Graphics();
    const bar = new Graphics();
    baseGraphics.set(base.id, g);
    baseBars.set(base.id, bar);
    baseLayer.addChild(g, bar);
    updateBaseVisual(base);
  }

  syncNpcSprites(payload.npcs);
  centerWorld();
});

socket.on("playerState", (player: PlayerState) => {
  playerState = player;
  ui.setPlayer(player);
  const base = playerState ? bases[playerState.baseId] : null;
  ui.setBase(base ?? null);
  updateTopBar();
});

socket.on("snapshot", (snapshot: { tiles: Record<string, TileSnapshot>; bases: Record<string, BaseSnapshot>; npcs: Record<string, NpcSnapshot>; players: Array<{ id: string; name: string }> }) => {
  tiles = snapshot.tiles;
  bases = snapshot.bases;
  playersList = snapshot.players;
  for (const tile of Object.values(tiles)) {
    updateTileVisual(tile);
  }
  for (const base of Object.values(bases)) {
    updateBaseVisual(base);
  }
  syncNpcSprites(snapshot.npcs);
  if (playerState) {
    ui.setBase(bases[playerState.baseId] ?? null);
  }
  updateTopBar();
});

app.ticker.add((delta) => {
  const dt = delta / 60;
  for (const sprite of npcSprites.values()) {
    sprite.update(dt);
  }
});

socket.on("serverFull", () => {
  alert("Server is full (8 players max). Try again later.");
});
