import { FluidSystem } from "./FluidSystem.js";

export class HydraFluidSystem extends FluidSystem {
  constructor(device, presentationFormat, maxParticles = 30000) {
    super(device, presentationFormat, maxParticles);
  }

  update(deltaTime, settings = {}) {
    super.update(deltaTime, {
      ...settings,

      // Безопасные настройки для smoke-test.
      // Частиц меньше, поток мягче, lifetime конечный.
      spawnRate: settings.spawnRate ?? 900,
      gravity: settings.gravity ?? 9.81,
      maxLifetime: settings.maxLifetime ?? 6.0,

      restitution: settings.restitution ?? 0.12,
      friction: settings.friction ?? 0.975,
      stickThreshold: settings.stickThreshold ?? 1.1,
      collisionOffset: settings.collisionOffset ?? 0.04,
    });
  }

  render(passEncoder, viewProjectionMatrix, settings = {}) {
    super.render(passEncoder, viewProjectionMatrix, {
      ...settings,
      baseColor: settings.baseColor ?? [0.35, 0.85, 1.0, 0.55],
      particleSize: settings.particleSize ?? 1.0,
    });
  }
}