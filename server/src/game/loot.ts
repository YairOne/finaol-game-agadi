import { nanoid } from "nanoid";
import { InventoryItem, Rarity } from "../types.js";
import { DROP_TABLE } from "./constants.js";

export const rollLoot = (rng: () => number = Math.random): Rarity => {
  const totalWeight = DROP_TABLE.reduce((sum, entry) => sum + entry.weight, 0);
  const roll = rng() * totalWeight;
  let cumulative = 0;
  for (const entry of DROP_TABLE) {
    cumulative += entry.weight;
    if (roll <= cumulative) {
      return entry.rarity;
    }
  }
  return "COMMON";
};

export const createInventoryItem = (rarity: Rarity): InventoryItem => {
  return {
    id: nanoid(),
    rarity
  };
};
