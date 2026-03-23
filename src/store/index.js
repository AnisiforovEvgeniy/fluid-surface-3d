import { makeAutoObservable, reaction } from "mobx";
import { CameraStore } from "./CameraStore";
import { RenderSettingsStore } from "./RenderSettingsStore";
import { FormSurfaceStore } from "./FormSurfaceStore";
import { FluidStore } from "./FluidStore";

const STORAGE_KEY = "controlPanelSettings";

class RootStore {
  constructor() {
    this.camera = new CameraStore();
    this.settings = new RenderSettingsStore();
    this.formSurface = new FormSurfaceStore();
    this.fluid = new FluidStore()

    makeAutoObservable(this);

    this.loadFromStorage();

    reaction(
      () => this.toJSON(),
      (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    );
  }

  resetAll = () => {
    this.camera.reset();
    this.settings.reset();
    this.formSurface.reset();
    this.fluid.reset()
  };

  toJSON() {
    return {
      settings: this.settings.toJSON(),
      camera: this.camera.toJSON(),
      formSurface: this.formSurface.toJSON(),
      fluid: this.fluid.toJSON()
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
        if (data.fluid) Object.assign(this.fluid, data.fluid);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }
}

export const store = new RootStore();