import { BaseSnapshot, NpcMode, PlayerState } from "./types";

const rarityColors: Record<string, string> = {
  COMMON: "#bdbdbd",
  UNCOMMON: "#4caf50",
  RARE: "#42a5f5",
  EPIC: "#ab47bc",
  LEGENDARY: "#ffb300",
  MYTHIC: "#ec407a",
  SECRET: "#00e5ff"
};

export interface UiCallbacks {
  onOpenBox: () => void;
  onPlaceNpc: (slotIndex: number, inventoryId: string) => void;
  onToggleNpc: (npcId: string, mode: NpcMode) => void;
}

export class GameUI {
  private root: HTMLElement;
  private topBar: HTMLElement;
  private callbacks: UiCallbacks;
  private player: PlayerState | null = null;
  private base: BaseSnapshot | null = null;
  private selectedInventoryId: string | null = null;
  private npcModes: Record<string, NpcMode> = {};
  private statusMessage = "Connecting to server...";

  constructor(root: HTMLElement, topBar: HTMLElement, callbacks: UiCallbacks) {
    this.root = root;
    this.topBar = topBar;
    this.callbacks = callbacks;
  }

  setPlayer(player: PlayerState) {
    this.player = player;
    this.render();
  }

  setBase(base: BaseSnapshot | null) {
    this.base = base;
    this.render();
  }

  setNpcModes(modes: Record<string, NpcMode>) {
    this.npcModes = modes;
    this.render();
  }

  setStatus(message: string) {
    this.statusMessage = message;
    if (!this.player) {
      this.render();
    }
  }

  updateTopBar(players: Array<{ name: string; tiles: number }>) {
    this.topBar.innerHTML = `
      <div><strong>Players</strong>: ${players.map((p) => `${p.name} (${p.tiles})`).join(" | ")}</div>
      <div class="status-line">Top owner: ${players[0]?.name ?? "-"}</div>
    `;
  }

  private render() {
    if (!this.player) {
      this.root.innerHTML = `
        <div class="panel">
          <h2>Status</h2>
          <div class="status-line">${this.statusMessage}</div>
        </div>
      `;
      return;
    }
    this.root.innerHTML = "";

    const inventoryPanel = document.createElement("div");
    inventoryPanel.className = "panel";
    inventoryPanel.innerHTML = `<h2>Inventory</h2>`;

    const openBoxButton = document.createElement("button");
    openBoxButton.textContent = "Open Box";
    openBoxButton.onclick = () => this.callbacks.onOpenBox();
    inventoryPanel.appendChild(openBoxButton);

    const list = document.createElement("div");
    list.style.marginTop = "10px";
    for (const item of this.player.inventory) {
      const row = document.createElement("div");
      row.className = "inventory-item";
      if (this.selectedInventoryId === item.id) {
        row.classList.add("selected");
      }
      row.innerHTML = `<span>${item.rarity}</span><span style="color:${rarityColors[item.rarity]}">●</span>`;
      row.onclick = () => {
        this.selectedInventoryId = item.id;
        this.render();
      };
      list.appendChild(row);
    }
    inventoryPanel.appendChild(list);

    const basePanel = document.createElement("div");
    basePanel.className = "panel";
    basePanel.innerHTML = `<h2>Base Slots</h2>`;

    const grid = document.createElement("div");
    grid.className = "slot-grid";
    if (this.base) {
      for (const slot of this.base.slots) {
        const slotEl = document.createElement("div");
        slotEl.className = "slot";
        if (!slot.unlocked) slotEl.classList.add("locked");
        const npcLabel = slot.npcId ? `NPC ${slot.npcId.slice(0, 4)}` : "Empty";
        slotEl.innerHTML = `
          <div>Slot ${slot.index + 1}</div>
          <div class="status-line">${slot.unlocked ? npcLabel : "Locked"}</div>
        `;
        if (slot.unlocked && !slot.npcId) {
          const button = document.createElement("button");
          button.textContent = "Place";
          button.disabled = !this.selectedInventoryId;
          button.onclick = () => {
            if (!this.selectedInventoryId) return;
            this.callbacks.onPlaceNpc(slot.index, this.selectedInventoryId);
            this.selectedInventoryId = null;
          };
          slotEl.appendChild(button);
        }
        if (slot.npcId) {
          const currentMode = this.npcModes[slot.npcId] ?? "CAPTURE";
          const toggle = document.createElement("button");
          toggle.textContent = currentMode === "CAPTURE" ? "Set Guard" : "Set Capture";
          toggle.onclick = () => {
            const nextMode = currentMode === "CAPTURE" ? "GUARD" : "CAPTURE";
            this.callbacks.onToggleNpc(slot.npcId!, nextMode);
          };
          slotEl.appendChild(toggle);
        }
        grid.appendChild(slotEl);
      }
    }
    basePanel.appendChild(grid);

    this.root.appendChild(inventoryPanel);
    this.root.appendChild(basePanel);
  }
}
