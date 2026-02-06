import { describe, expect, it } from "vitest";
import { applyCapture, captureMultiplier } from "../src/game/capture.js";
import { NpcEntity, Tile } from "../src/types.js";

const makeNpc = (): NpcEntity => ({
  id: "npc",
  ownerPlayerId: "player-a",
  rarity: "COMMON",
  mode: "CAPTURE",
  x: 0,
  y: 0,
  hp: 10,
  targetTileId: null,
  attackCooldown: 0
});

const makeTile = (owner: string | null): Tile => ({
  id: "tile",
  x: 0,
  y: 0,
  neighbors: [],
  ownerPlayerId: owner,
  protectedByPlayerId: null,
  captureProgress: 0,
  captureByPlayerId: null
});

describe("capture", () => {
  it("captures neutral tiles faster than enemy tiles", () => {
    const npc = makeNpc();
    const neutral = makeTile(null);
    const enemy = makeTile("enemy");

    applyCapture(neutral, npc, 0.1, 1);
    applyCapture(enemy, npc, 0.1, 1);

    expect(neutral.captureProgress).toBeCloseTo(0.1, 3);
    expect(enemy.captureProgress).toBeCloseTo(0.045, 3);
    expect(captureMultiplier(enemy)).toBeLessThan(captureMultiplier(neutral));
  });
});
