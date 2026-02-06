export type Rarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"
  | "SECRET";

export type NpcMode = "CAPTURE" | "GUARD";

export interface NpcStats {
  speed: number;
  hp: number;
  damage: number;
  captureRate: number;
}

export interface InventoryItem {
  id: string;
  rarity: Rarity;
}

export interface Tile {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
  ownerPlayerId: string | null;
  protectedByPlayerId: string | null;
  captureProgress: number;
  captureByPlayerId: string | null;
}

export interface BaseSlot {
  index: number;
  unlocked: boolean;
  npcId: string | null;
  x: number;
  y: number;
}

export interface Base {
  id: string;
  playerId: string | null;
  x: number;
  y: number;
  coreHp: number;
  coreMaxHp: number;
  respawnTimer: number;
  slots: BaseSlot[];
}

export interface Player {
  id: string;
  name: string;
  baseId: string;
  inventory: InventoryItem[];
}

export interface NpcEntity {
  id: string;
  ownerPlayerId: string;
  rarity: Rarity;
  mode: NpcMode;
  x: number;
  y: number;
  hp: number;
  targetTileId: string | null;
  attackCooldown: number;
}

export interface GameState {
  players: Record<string, Player>;
  tiles: Record<string, Tile>;
  bases: Record<string, Base>;
  npcs: Record<string, NpcEntity>;
  time: number;
}
