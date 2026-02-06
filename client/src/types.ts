export type Rarity =
  | "COMMON"
  | "UNCOMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"
  | "SECRET";

export type NpcMode = "CAPTURE" | "GUARD";

export interface TileSnapshot {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
  ownerPlayerId: string | null;
  protectedByPlayerId: string | null;
  captureProgress: number;
  captureByPlayerId: string | null;
}

export interface BaseSlotSnapshot {
  index: number;
  unlocked: boolean;
  npcId: string | null;
  x: number;
  y: number;
}

export interface BaseSnapshot {
  id: string;
  playerId: string | null;
  x: number;
  y: number;
  coreHp: number;
  coreMaxHp: number;
  respawnTimer: number;
  slots: BaseSlotSnapshot[];
}

export interface NpcSnapshot {
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

export interface PlayerState {
  id: string;
  name: string;
  baseId: string;
  inventory: Array<{ id: string; rarity: Rarity }>;
}
