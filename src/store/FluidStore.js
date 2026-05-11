import { makeAutoObservable } from "mobx";

export class FluidStore {
  fluidMode = true;
  fluidEngine = "simple";

  hydraSpawnRate = 900;
  hydraLifetime = 6.0;
  hydraGravity = 9.81;
  hydraAlpha = 0.55;
  hydraParticleRadius = 0.018;

  constructor() {
    makeAutoObservable(this);
  }

  setFluidMode = (value) => {
    this.fluidMode = value;
  };

  setFluidEngine = (value) => {
    this.fluidEngine = value;
  };

  setHydraSpawnRate = (value) => {
    this.hydraSpawnRate = value;
  };

  setHydraLifetime = (value) => {
    this.hydraLifetime = value;
  };

  setHydraGravity = (value) => {
    this.hydraGravity = value;
  };

  setHydraAlpha = (value) => {
    this.hydraAlpha = value;
  };

  setHydraParticleRadius = (value) => {
    this.hydraParticleRadius = value;
  };

  reset = () => {
    this.fluidMode = false;
    this.fluidEngine = "simple";

    this.hydraSpawnRate = 900;
    this.hydraLifetime = 6.0;
    this.hydraGravity = 9.81;
    this.hydraAlpha = 0.55;
    this.hydraParticleRadius = 0.018;
  };

  toJSON() {
    return {
      fluidMode: this.fluidMode,
      fluidEngine: this.fluidEngine,
      hydraSpawnRate: this.hydraSpawnRate,
      hydraLifetime: this.hydraLifetime,
      hydraGravity: this.hydraGravity,
      hydraAlpha: this.hydraAlpha,
      hydraParticleRadius: this.hydraParticleRadius,
    };
  }

  fromJSON(json) {
    if (json.fluidMode !== undefined) this.fluidMode = json.fluidMode;
    if (json.fluidEngine !== undefined) this.fluidEngine = json.fluidEngine;
    if (json.hydraSpawnRate !== undefined) this.hydraSpawnRate = json.hydraSpawnRate;
    if (json.hydraLifetime !== undefined) this.hydraLifetime = json.hydraLifetime;
    if (json.hydraGravity !== undefined) this.hydraGravity = json.hydraGravity;
    if (json.hydraAlpha !== undefined) this.hydraAlpha = json.hydraAlpha;
    if (json.hydraParticleRadius !== undefined) this.hydraParticleRadius = json.hydraParticleRadius;
  }
}