import { makeAutoObservable } from "mobx";

const STORAGE_KEY = "settings";

export class RenderSettingsStore {
  countCell = 20;
  sizeCell = 0.2;
  showGrid = true;
  colorMode = 0;

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  setCountCell = (value) => {
    this.countCell = value;
  };

  setSizeCell = (value) => {
    this.sizeCell = value;
  };

  setShowGrid = (value) => {
    this.showGrid = value;
  };

  setColorMode = (value) => {
    this.colorMode = value;
  };

  resetValue = () => {
    this.countCell = 20;
    this.sizeCell = 0.2;
    this.showGrid = true;
    this.colorMode = 0;
  };

  toJSON() {
    return {
      countCell: this.countCell,
      sizeCell: this.sizeCell,
      showGrid: this.showGrid,
      colorMode: this.colorMode,
    };
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.countCell !== undefined) this.countCell = data.countCell;
        if (data.sizeCell !== undefined) this.sizeCell = data.sizeCell;
        if (data.showGrid !== undefined) this.showGrid = data.showGrid;
        if (data.colorMode !== undefined) this.colorMode = data.colorMode;
      }
    } catch (e) {
      console.error("Failed to load render settings", e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch (e) {
      console.error("Failed to save render settings", e);
    }
  }
}