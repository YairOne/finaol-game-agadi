import { NpcStats, Rarity } from "../types.js";

export const TICK_RATE = 20;
export const SNAPSHOT_RATE = 10;
export const MAX_PLAYERS = 8;
export const MAP_ROWS = 10;
export const MAP_COLS = 15;
export const TILE_SPACING = 90;
export const TILE_CAPTURE_RADIUS = 26;
export const GUARD_RADIUS = 160;
export const NPC_ATTACK_RANGE = 28;
export const CORE_ATTACK_RANGE = 40;
export const CORE_MAX_HP = 500;
export const CORE_RESPAWN_TIME = 5;

export const RARITY_STATS: Record<Rarity, NpcStats> = {
  COMMON: { speed: 60, hp: 60, damage: 5, captureRate: 0.06 },
  UNCOMMON: { speed: 70, hp: 80, damage: 7, captureRate: 0.075 },
  RARE: { speed: 85, hp: 100, damage: 10, captureRate: 0.09 },
  EPIC: { speed: 95, hp: 130, damage: 14, captureRate: 0.11 },
  LEGENDARY: { speed: 110, hp: 170, damage: 20, captureRate: 0.14 },
  MYTHIC: { speed: 125, hp: 220, damage: 28, captureRate: 0.18 },
  SECRET: { speed: 150, hp: 300, damage: 40, captureRate: 0.24 }
};

export const DROP_TABLE: Array<{ rarity: Rarity; weight: number }> = [
  { rarity: "COMMON", weight: 60 },
  { rarity: "UNCOMMON", weight: 22 },
  { rarity: "RARE", weight: 10 },
  { rarity: "EPIC", weight: 5 },
  { rarity: "LEGENDARY", weight: 2 },
  { rarity: "MYTHIC", weight: 0.9 },
  { rarity: "SECRET", weight: 0.1 }
];

export const RARITY_COLORS: Record<Rarity, string> = {
  COMMON: "#bdbdbd",
  UNCOMMON: "#4caf50",
  RARE: "#42a5f5",
  EPIC: "#ab47bc",
  LEGENDARY: "#ffb300",
  MYTHIC: "#ec407a",
  SECRET: "#00e5ff"
};
