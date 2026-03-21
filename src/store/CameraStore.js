import { makeAutoObservable } from "mobx";

const STORAGE_KEY = "cameraSettings";

export class CameraStore {
  radiusCamera = 15;
  azimuthCamera = 0;

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  setRadiusCamera = (value) => {
    this.radiusCamera = value;
  };

  setAzimuthCamera = (value) => {
    this.azimuthCamera = value;
  };

  reset = () => {
    this.radiusCamera = 15;
    this.azimuthCamera = 0;
  };

  toJSON() {
    return {
      radiusCamera: this.radiusCamera,
      azimuthCamera: this.azimuthCamera,
    };
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.radiusCamera !== undefined) this.radiusCamera = data.radiusCamera;
        if (data.azimuthCamera !== undefined) this.azimuthCamera = data.azimuthCamera;
      }
    } catch (e) {
      console.error("Failed to load camera settings", e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch (e) {
      console.error("Failed to save camera settings", e);
    }
  }
}