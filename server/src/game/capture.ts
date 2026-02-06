import { Tile, NpcEntity } from "../types.js";

export const captureMultiplier = (tile: Tile): number => {
  if (!tile.ownerPlayerId) return 1;
  return 0.45;
};

export const applyCapture = (
  tile: Tile,
  npc: NpcEntity,
  captureRate: number,
  dt: number
): void => {
  if (tile.protectedByPlayerId && tile.protectedByPlayerId !== npc.ownerPlayerId) {
    return;
  }
  if (tile.ownerPlayerId === npc.ownerPlayerId) {
    tile.captureProgress = 0;
    tile.captureByPlayerId = null;
    return;
  }

  if (tile.captureByPlayerId !== npc.ownerPlayerId) {
    tile.captureByPlayerId = npc.ownerPlayerId;
    tile.captureProgress = 0;
  }

  tile.captureProgress = Math.min(
    1,
    tile.captureProgress + captureRate * captureMultiplier(tile) * dt
  );

  if (tile.captureProgress >= 1) {
    tile.ownerPlayerId = npc.ownerPlayerId;
    tile.captureProgress = 0;
    tile.captureByPlayerId = null;
  }
};
