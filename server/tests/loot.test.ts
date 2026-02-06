import { describe, expect, it } from "vitest";
import { rollLoot } from "../src/game/loot.js";
import { mulberry32 } from "../src/utils/random.js";

const countRarities = (rolls: number) => {
  const rng = mulberry32(123456);
  const counts = new Map<string, number>();
  for (let i = 0; i < rolls; i += 1) {
    const rarity = rollLoot(rng);
    counts.set(rarity, (counts.get(rarity) ?? 0) + 1);
  }
  return counts;
};

describe("rollLoot", () => {
  it("produces a spread of rarities", () => {
    const counts = countRarities(2000);
    expect(counts.get("COMMON")).toBeGreaterThan(900);
    expect(counts.get("UNCOMMON")).toBeGreaterThan(250);
    expect(counts.get("RARE")).toBeGreaterThan(80);
  });
});
