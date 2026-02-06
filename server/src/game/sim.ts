import { nanoid } from "nanoid";
import {
  Base,
  GameState,
  NpcEntity,
  NpcMode,
  Player,
  Tile
} from "../types.js";
import {
  CORE_ATTACK_RANGE,
  CORE_MAX_HP,
  CORE_RESPAWN_TIME,
  GUARD_RADIUS,
  NPC_ATTACK_RANGE,
  RARITY_STATS,
  TILE_CAPTURE_RADIUS
} from "./constants.js";
import { applyCapture } from "./capture.js";
import { assignProtectedTiles } from "./map.js";

const distance = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(ax - bx, ay - by);

export const addPlayerToBase = (
  state: GameState,
  playerId: string,
  name: string
): Player | null => {
  const base = Object.values(state.bases).find((b) => !b.playerId);
  if (!base) return null;
  base.playerId = playerId;
  base.coreHp = CORE_MAX_HP;
  base.respawnTimer = 0;
  for (const slot of base.slots) {
    slot.npcId = null;
  }
  assignProtectedTiles(state.tiles, base.id, playerId, base.x, base.y);
  const player: Player = {
    id: playerId,
    name,
    baseId: base.id,
    inventory: []
  };
  state.players[playerId] = player;
  return player;
};

export const removePlayer = (state: GameState, playerId: string): void => {
  const player = state.players[playerId];
  if (!player) return;
  const base = state.bases[player.baseId];
  if (base) {
    base.playerId = null;
    base.coreHp = CORE_MAX_HP;
    base.respawnTimer = 0;
    for (const slot of base.slots) {
      slot.npcId = null;
    }
  }
  for (const npc of Object.values(state.npcs)) {
    if (npc.ownerPlayerId === playerId) {
      delete state.npcs[npc.id];
    }
  }
  for (const tile of Object.values(state.tiles)) {
    if (tile.ownerPlayerId === playerId && tile.protectedByPlayerId !== playerId) {
      tile.ownerPlayerId = null;
    }
  }
  delete state.players[playerId];
};

export const spawnNpc = (
  state: GameState,
  playerId: string,
  rarity: NpcEntity["rarity"],
  slotIndex: number
): NpcEntity | null => {
  const player = state.players[playerId];
  if (!player) return null;
  const base = state.bases[player.baseId];
  if (!base) return null;
  const slot = base.slots.find((s) => s.index === slotIndex);
  if (!slot || !slot.unlocked || slot.npcId) return null;

  const stats = RARITY_STATS[rarity];
  const npc: NpcEntity = {
    id: nanoid(),
    ownerPlayerId: playerId,
    rarity,
    mode: "CAPTURE",
    x: slot.x,
    y: slot.y,
    hp: stats.hp,
    targetTileId: null,
    attackCooldown: 0
  };
  state.npcs[npc.id] = npc;
  slot.npcId = npc.id;
  return npc;
};

const findNearestTile = (
  state: GameState,
  npc: NpcEntity,
  preferNeutral: boolean
): Tile | null => {
  let bestTile: Tile | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const tile of Object.values(state.tiles)) {
    if (tile.protectedByPlayerId && tile.protectedByPlayerId !== npc.ownerPlayerId) {
      continue;
    }
    if (tile.ownerPlayerId === npc.ownerPlayerId) {
      continue;
    }
    if (preferNeutral && tile.ownerPlayerId) {
      continue;
    }
    const dist = distance(npc.x, npc.y, tile.x, tile.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestTile = tile;
    }
  }
  return bestTile;
};

const handleCoreDestroyed = (
  state: GameState,
  base: Base,
  attackerId: string
): void => {
  if (base.respawnTimer > 0) return;
  for (const tile of Object.values(state.tiles)) {
    if (tile.ownerPlayerId === base.playerId && tile.protectedByPlayerId !== base.playerId) {
      tile.ownerPlayerId = attackerId;
      tile.captureProgress = 0;
      tile.captureByPlayerId = null;
    }
  }
  base.coreHp = 0;
  base.respawnTimer = CORE_RESPAWN_TIME;
};

const updateNpcMovement = (state: GameState, npc: NpcEntity, dt: number): void => {
  const stats = RARITY_STATS[npc.rarity];
  if (npc.mode === "GUARD") {
    const base = state.bases[state.players[npc.ownerPlayerId]?.baseId ?? ""];
    if (base) {
      const distToBase = distance(npc.x, npc.y, base.x, base.y);
      if (distToBase > GUARD_RADIUS) {
        const dx = base.x - npc.x;
        const dy = base.y - npc.y;
        const len = Math.hypot(dx, dy) || 1;
        npc.x += (dx / len) * stats.speed * dt;
        npc.y += (dy / len) * stats.speed * dt;
      }
    }
    return;
  }

  let targetTile = npc.targetTileId ? state.tiles[npc.targetTileId] : null;
  if (!targetTile || targetTile.ownerPlayerId === npc.ownerPlayerId) {
    const neutral = findNearestTile(state, npc, true);
    targetTile = neutral ?? findNearestTile(state, npc, false);
    npc.targetTileId = targetTile?.id ?? null;
  }
  if (!targetTile) return;

  const dx = targetTile.x - npc.x;
  const dy = targetTile.y - npc.y;
  const dist = Math.hypot(dx, dy);
  if (dist > TILE_CAPTURE_RADIUS) {
    npc.x += (dx / dist) * stats.speed * dt;
    npc.y += (dy / dist) * stats.speed * dt;
  } else {
    applyCapture(targetTile, npc, stats.captureRate, dt);
  }
};

const updateCombat = (state: GameState, npc: NpcEntity, dt: number): void => {
  npc.attackCooldown = Math.max(0, npc.attackCooldown - dt);
  if (npc.attackCooldown > 0) return;
  const stats = RARITY_STATS[npc.rarity];

  let closestEnemy: NpcEntity | null = null;
  let closestDist = Number.POSITIVE_INFINITY;
  for (const other of Object.values(state.npcs)) {
    if (other.ownerPlayerId === npc.ownerPlayerId) continue;
    const dist = distance(npc.x, npc.y, other.x, other.y);
    if (dist < NPC_ATTACK_RANGE && dist < closestDist) {
      closestDist = dist;
      closestEnemy = other;
    }
  }
  if (closestEnemy) {
    closestEnemy.hp -= stats.damage;
    npc.attackCooldown = 1;
    if (closestEnemy.hp <= 0) {
      const ownerBase = state.players[closestEnemy.ownerPlayerId]?.baseId;
      if (ownerBase) {
        const base = state.bases[ownerBase];
        if (base) {
          const slot = base.slots.find((s) => s.npcId === closestEnemy.id);
          if (slot) slot.npcId = null;
        }
      }
      delete state.npcs[closestEnemy.id];
    }
    return;
  }

  for (const base of Object.values(state.bases)) {
    if (!base.playerId || base.playerId === npc.ownerPlayerId) continue;
    if (base.respawnTimer > 0) continue;
    const dist = distance(npc.x, npc.y, base.x, base.y);
    if (dist < CORE_ATTACK_RANGE) {
      base.coreHp -= stats.damage;
      npc.attackCooldown = 1;
      if (base.coreHp <= 0 && base.playerId) {
        handleCoreDestroyed(state, base, npc.ownerPlayerId);
      }
      return;
    }
  }
};

export const updateSimulation = (state: GameState, dt: number): void => {
  state.time += dt;
  for (const base of Object.values(state.bases)) {
    if (base.respawnTimer > 0) {
      base.respawnTimer -= dt;
      if (base.respawnTimer <= 0) {
        base.coreHp = base.coreMaxHp;
      }
    }
  }

  const npcs = Object.values(state.npcs);
  for (const npc of npcs) {
    if (npc.hp <= 0) {
      delete state.npcs[npc.id];
      continue;
    }
    updateNpcMovement(state, npc, dt);
  }

  for (const npc of Object.values(state.npcs)) {
    updateCombat(state, npc, dt);
  }
};

export const setNpcMode = (
  state: GameState,
  npcId: string,
  mode: NpcMode,
  playerId: string
): boolean => {
  const npc = state.npcs[npcId];
  if (!npc) return false;
  if (npc.ownerPlayerId !== playerId) return false;
  npc.mode = mode;
  return true;
};
