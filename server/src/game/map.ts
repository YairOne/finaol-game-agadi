import { nanoid } from "nanoid";
import { Base, BaseSlot, Tile } from "../types.js";
import {
  CORE_MAX_HP,
  MAP_COLS,
  MAP_ROWS,
  MAX_PLAYERS,
  TILE_SPACING
} from "./constants.js";

export const createTiles = (): Record<string, Tile> => {
  const tiles: Record<string, Tile> = {};
  const points: Tile[] = [];
  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      const x = col * TILE_SPACING + (row % 2 === 0 ? 0 : TILE_SPACING * 0.5);
      const y = row * TILE_SPACING * 0.86;
      const id = nanoid();
      const tile: Tile = {
        id,
        x,
        y,
        neighbors: [],
        ownerPlayerId: null,
        protectedByPlayerId: null,
        captureProgress: 0,
        captureByPlayerId: null
      };
      tiles[id] = tile;
      points.push(tile);
    }
  }

  const tileArray = Object.values(tiles);
  for (const tile of tileArray) {
    for (const other of tileArray) {
      if (tile.id === other.id) continue;
      const dx = tile.x - other.x;
      const dy = tile.y - other.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < TILE_SPACING * 1.05) {
        tile.neighbors.push(other.id);
      }
    }
  }

  return tiles;
};

export const createBases = (tiles: Record<string, Tile>): Record<string, Base> => {
  const tileArray = Object.values(tiles);
  const minX = Math.min(...tileArray.map((t) => t.x));
  const maxX = Math.max(...tileArray.map((t) => t.x));
  const minY = Math.min(...tileArray.map((t) => t.y));
  const maxY = Math.max(...tileArray.map((t) => t.y));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const positions = [
    { x: minX - 120, y: minY - 120 },
    { x: midX, y: minY - 140 },
    { x: maxX + 120, y: minY - 120 },
    { x: maxX + 160, y: midY },
    { x: maxX + 120, y: maxY + 120 },
    { x: midX, y: maxY + 140 },
    { x: minX - 120, y: maxY + 120 },
    { x: minX - 160, y: midY }
  ];

  const bases: Record<string, Base> = {};
  for (let i = 0; i < MAX_PLAYERS; i += 1) {
    const id = nanoid();
    const pos = positions[i] ?? { x: midX, y: midY };
    const slots: BaseSlot[] = [];
    for (let s = 0; s < 8; s += 1) {
      const angle = (Math.PI * 2 * s) / 8;
      slots.push({
        index: s,
        unlocked: s < 4,
        npcId: null,
        x: pos.x + Math.cos(angle) * 60,
        y: pos.y + Math.sin(angle) * 60
      });
    }
    bases[id] = {
      id,
      playerId: null,
      x: pos.x,
      y: pos.y,
      coreHp: CORE_MAX_HP,
      coreMaxHp: CORE_MAX_HP,
      respawnTimer: 0,
      slots
    };
  }

  return bases;
};

export const assignProtectedTiles = (
  tiles: Record<string, Tile>,
  baseId: string,
  playerId: string,
  baseX: number,
  baseY: number
): void => {
  const tileArray = Object.values(tiles);
  tileArray.sort((a, b) => {
    const da = Math.hypot(a.x - baseX, a.y - baseY);
    const db = Math.hypot(b.x - baseX, b.y - baseY);
    return da - db;
  });

  const protectedTiles = tileArray.slice(0, 10);
  for (const tile of protectedTiles) {
    tile.ownerPlayerId = playerId;
    tile.protectedByPlayerId = playerId;
    tile.captureProgress = 0;
    tile.captureByPlayerId = null;
  }
};
