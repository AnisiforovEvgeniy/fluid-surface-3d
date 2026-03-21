import { makeAutoObservable, reaction } from "mobx";
import { CameraStore } from "./CameraStore";
import { RenderSettingsStore } from "./RenderSettingsStore";
import { FormSurfaceStore } from "./FormSurfaceStore";

const STORAGE_KEY = "controlPanelSettings";

class RootStore {
  constructor() {
    this.camera = new CameraStore();
    this.settings = new RenderSettingsStore();
    this.formSurface = new FormSurfaceStore();

    makeAutoObservable(this);

    // Загружаем при старте
    this.loadFromStorage();

    // Автосохранение при ЛЮБОМ изменении
    reaction(
      () => this.toJSON(),
      (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    );
  }

  resetAll = () => {
    this.camera.reset();
    this.settings.reset();
    this.formSurface.reset();
  };

  toJSON() {
    return {
      settings: this.settings.toJSON(),
      camera: this.camera.toJSON(),
      formSurface: this.formSurface.toJSON(),
    };
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.settings) Object.assign(this.settings, data.settings);
        if (data.camera) Object.assign(this.camera, data.camera);
        if (data.formSurface) Object.assign(this.formSurface, data.formSurface);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }
}

export const store = new RootStore();