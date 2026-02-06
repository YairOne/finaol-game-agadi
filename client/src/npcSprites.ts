import * as PIXI from "pixi.js";
import { Rarity } from "./types";

const rarityColors: Record<Rarity, number> = {
  COMMON: 0xbdbdbd,
  UNCOMMON: 0x4caf50,
  RARE: 0x42a5f5,
  EPIC: 0xab47bc,
  LEGENDARY: 0xffb300,
  MYTHIC: 0xec407a,
  SECRET: 0x00e5ff
};

const randomFromSeed = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

export interface NpcVisual {
  container: PIXI.Container;
  update: (dt: number) => void;
}

export const createNpcSprite = (rarity: Rarity, seed: number): NpcVisual => {
  const rng = randomFromSeed(seed);
  const baseColor = rarityColors[rarity];
  const accentHue = Math.floor(rng() * 40 - 20);
  const accentColor = PIXI.utils.string2hex(
    `hsl(${(accentHue + 200 + rng() * 40) % 360}, 70%, 60%)`
  );

  const container = new PIXI.Container();
  const body = new PIXI.Graphics();
  const head = new PIXI.Graphics();
  const eyes = new PIXI.Graphics();
  const arms = new PIXI.Graphics();
  const legs = new PIXI.Graphics();
  const accessory = new PIXI.Graphics();
  const aura = new PIXI.Graphics();
  const trail = new PIXI.Graphics();
  const orbiters = new PIXI.Container();
  const rune = new PIXI.Graphics();

  const bodyColor = baseColor;
  const limbColor = baseColor - 0x222222;

  body.beginFill(bodyColor).drawRoundedRect(-8, -4, 16, 18, 6).endFill();
  head.beginFill(bodyColor).drawCircle(0, -12, 7).endFill();
  eyes.beginFill(0xffffff).drawCircle(-2, -14, 1.4).drawCircle(2, -14, 1.4).endFill();
  arms.beginFill(limbColor).drawRoundedRect(-14, -2, 6, 12, 3).drawRoundedRect(8, -2, 6, 12, 3).endFill();
  legs.beginFill(limbColor).drawRoundedRect(-6, 12, 5, 10, 3).drawRoundedRect(1, 12, 5, 10, 3).endFill();

  accessory.beginFill(accentColor);
  if (rarity === "UNCOMMON") {
    accessory.drawRoundedRect(-10, 2, 20, 4, 2);
  }
  if (rarity === "RARE") {
    accessory.drawPolygon([-6, -6, 0, -18, 6, -6]);
  }
  if (rarity === "LEGENDARY") {
    accessory.drawPolygon([-5, -20, 0, -28, 5, -20]);
  }
  if (rarity === "SECRET") {
    accessory.drawRoundedRect(-4, -18, 8, 14, 3);
    accessory.lineStyle(1, 0x000000, 0.6).moveTo(-2, -12).lineTo(2, -12);
  }
  accessory.endFill();

  aura.beginFill(baseColor, rarity === "EPIC" || rarity === "LEGENDARY" ? 0.25 : 0);
  aura.drawCircle(0, 4, 18);
  aura.endFill();

  trail.beginFill(baseColor, 0.2).drawEllipse(-6, 14, 8, 4).endFill();

  if (rarity === "MYTHIC") {
    for (let i = 0; i < 4; i += 1) {
      const shard = new PIXI.Graphics();
      shard.beginFill(accentColor).drawPolygon([-2, -4, 0, -6, 2, -4, 0, 4]);
      shard.endFill();
      shard.position.set(Math.cos((Math.PI * 2 * i) / 4) * 16, Math.sin((Math.PI * 2 * i) / 4) * 16);
      orbiters.addChild(shard);
    }
    rune.lineStyle(2, accentColor, 0.5).drawCircle(0, 18, 12);
    rune.lineStyle(1, accentColor, 0.5).drawCircle(0, 18, 6);
  }

  container.addChild(rune, aura, trail, legs, body, arms, head, eyes, accessory, orbiters);

  let time = rng() * 10;
  return {
    container,
    update: (dt: number) => {
      time += dt;
      const breathe = 1 + Math.sin(time * 2) * 0.03;
      body.scale.set(1, breathe);
      head.y = -12 + Math.sin(time * 1.5) * 1.4;
      arms.rotation = Math.sin(time * 1.8) * 0.1;
      legs.y = 12 + Math.sin(time * 1.6) * 0.4;

      const blink = Math.sin(time * 3 + seed) > 0.9 ? 0.2 : 1;
      eyes.scale.y = blink;

      if (rarity === "EPIC") {
        aura.alpha = 0.2 + Math.sin(time * 4) * 0.1;
      }
      if (rarity === "LEGENDARY") {
        aura.scale.set(1 + Math.sin(time * 3) * 0.05);
        trail.alpha = 0.2 + Math.sin(time * 2) * 0.1;
      }
      if (rarity === "MYTHIC") {
        orbiters.rotation += dt * 0.6;
        rune.alpha = 0.5 + Math.sin(time * 2.4) * 0.2;
      }
      if (rarity === "SECRET") {
        container.alpha = 0.85 + Math.sin(time * 8) * 0.15;
        container.x += Math.sin(time * 6) * 0.1;
      }
    }
  };
};
