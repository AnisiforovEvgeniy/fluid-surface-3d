import { makeAutoObservable } from "mobx";

export class FluidStore {
  fluidMode = true;
  fluidEngine = "simple";

  constructor() {
    makeAutoObservable(this);
  }

  setFluidMode = (value) => {
    this.fluidMode = value;
  };

  setFluidEngine = (value) => {
    this.fluidEngine = value;
  };

  reset = () => {
    this.fluidMode = false;
    this.fluidEngine = "simple";
  };

  toJSON() {
    return {
      fluidMode: this.fluidMode,
      fluidEngine: this.fluidEngine,
    };
  }

  fromJSON(json) {
    if (json.fluidMode !== undefined) this.fluidMode = json.fluidMode;
    if (json.fluidEngine !== undefined) this.fluidEngine = json.fluidEngine;
  }
}