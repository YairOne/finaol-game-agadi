import { nanoid } from "nanoid";
import { Base, GameState, Player } from "../types.js";
import { createBases, createTiles } from "./map.js";

export const createInitialState = (): GameState => {
  const tiles = createTiles();
  const bases = createBases(tiles);

  return {
    players: {},
    tiles,
    bases,
    npcs: {},
    time: 0
  };
};

export const createPlayer = (name: string, baseId: string): Player => {
  return {
    id: nanoid(),
    name,
    baseId,
    inventory: []
  };
};

export const resetBase = (base: Base): void => {
  base.coreHp = base.coreMaxHp;
  base.respawnTimer = 0;
};
