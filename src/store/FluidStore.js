import { makeAutoObservable } from "mobx";

export class FluidStore {
  fluidMode = false;

  constructor() {
    makeAutoObservable(this);
  }

  setFluidMode = (value) => {
    this.fluidMode = value;
  };

  reset = () => {
    this.fluidMode = false;
  };

  toJSON() {
    return {
      fluidMode: this.fluidMode,
    };
  }

  fromJSON(json) {
    if (json.fluidMode !== undefined) this.fluidMode = json.fluidMode;
  }
}