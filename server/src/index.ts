import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { createInitialState } from "./game/state.js";
import {
  addPlayerToBase,
  removePlayer,
  setNpcMode,
  spawnNpc,
  updateSimulation
} from "./game/sim.js";
import { rollLoot, createInventoryItem } from "./game/loot.js";
import { SNAPSHOT_RATE, TICK_RATE } from "./game/constants.js";

const PORT = 3001;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const state = createInitialState();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

io.on("connection", (socket) => {
  const player = addPlayerToBase(state, socket.id, `Player-${socket.id.slice(0, 4)}`);
  if (!player) {
    socket.emit("serverFull");
    socket.disconnect();
    return;
  }

  socket.emit("init", {
    playerId: player.id,
    tiles: state.tiles,
    bases: state.bases,
    npcs: state.npcs,
    players: Object.values(state.players).map((p) => ({ id: p.id, name: p.name }))
  });
  socket.emit("playerState", player);

  socket.on("openBox", () => {
    const rarity = rollLoot();
    const item = createInventoryItem(rarity);
    player.inventory.push(item);
    socket.emit("playerState", player);
  });

  socket.on("placeNpc", ({ slotIndex, inventoryId }) => {
    const itemIndex = player.inventory.findIndex((item) => item.id === inventoryId);
    if (itemIndex === -1) return;
    const [item] = player.inventory.splice(itemIndex, 1);
    const npc = spawnNpc(state, player.id, item.rarity, slotIndex);
    if (!npc) {
      player.inventory.push(item);
      return;
    }
    socket.emit("playerState", player);
  });

  socket.on("setNpcMode", ({ npcId, mode }) => {
    setNpcMode(state, npcId, mode, player.id);
  });

  socket.on("disconnect", () => {
    removePlayer(state, socket.id);
  });
});

const tickInterval = 1000 / TICK_RATE;
setInterval(() => {
  updateSimulation(state, 1 / TICK_RATE);
}, tickInterval);

const snapshotInterval = 1000 / SNAPSHOT_RATE;
setInterval(() => {
  io.emit("snapshot", {
    time: state.time,
    tiles: state.tiles,
    bases: state.bases,
    npcs: state.npcs,
    players: Object.values(state.players).map((p) => ({ id: p.id, name: p.name }))
  });
}, snapshotInterval);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
