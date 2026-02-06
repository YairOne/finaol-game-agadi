# Finaol Game Agadi

Real-time multiplayer 2D strategy game with an authoritative server, PixiJS rendering, and loot box-driven NPCs.

## Folder structure
```
.
├── client
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── src
│       ├── main.ts
│       ├── npcSprites.ts
│       ├── types.ts
│       └── ui.ts
├── server
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── utils
│   │   │   └── random.ts
│   │   └── game
│   │       ├── constants.ts
│   │       ├── capture.ts
│   │       ├── loot.ts
│   │       ├── map.ts
│   │       ├── sim.ts
│   │       └── state.ts
│   └── tests
│       ├── capture.test.ts
│       └── loot.test.ts
├── package.json
└── README.md
```

## Requirements
- Node.js 18+

## Setup
```bash
npm install
```

## Run locally (server + client)
```bash
npm run start
```

- Server runs on `http://localhost:3001`
- Client runs on `http://localhost:5173`

Open two browser tabs to play as multiple players.

## Individual commands
```bash
npm run server
npm run dev
```

## Run tests
```bash
npm test
```

## Gameplay basics
- Open loot boxes to gain NPCs.
- Place NPCs into unlocked base pads.
- Toggle NPC mode between **Guard** and **Capture**.
- Capture neutral pentagon tiles first, then enemy tiles.
- Destroy enemy core to transfer all their non-protected territory.
