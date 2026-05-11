import { FluidSystem } from "./FluidSystem.js";

export class HydraFluidSystem extends FluidSystem {
  constructor(device, presentationFormat, maxParticles = 30000) {
    super(device, presentationFormat, maxParticles);
  }

  async createShaderModules() {
    const computeCode = await fetch("./shaders/fluid/fluid_compute.wgsl").then((r) =>
      r.text()
    );

    this.computeModule = this.device.createShaderModule({
      code: computeCode,
    });

    const [vertexCode, fragmentCode] = await Promise.all([
      fetch("./shaders/hydra/hydra_billboard_vertex.wgsl").then((r) => r.text()),
      fetch("./shaders/hydra/hydra_billboard_fragment.wgsl").then((r) => r.text()),
    ]);

    this.renderModule = this.device.createShaderModule({
      code: vertexCode + fragmentCode,
    });
  }

  createPipelines() {
    this.computePipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: {
        module: this.computeModule,
        entryPoint: "update",
      },
    });

    this.renderPipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.renderModule,
        entryPoint: "vs_main",
        buffers: [],
      },
      fragment: {
        module: this.renderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: this.presentationFormat,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
      multisample: {
        count: 4,
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }

  update(deltaTime, settings = {}) {
    super.update(deltaTime, {
      ...settings,
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
    const particleRadius = settings.particleRadius ?? 0.018;
    const baseColor = settings.baseColor ?? [0.35, 0.85, 1.0, 0.55];

    const renderData = new Float32Array(24);

    renderData.set(viewProjectionMatrix, 0);

    renderData[16] = particleRadius;
    renderData[17] = 0.0;
    renderData[18] = 0.0;
    renderData[19] = 0.0;

    renderData[20] = baseColor[0];
    renderData[21] = baseColor[1];
    renderData[22] = baseColor[2];
    renderData[23] = baseColor[3];

    this.device.queue.writeBuffer(this.renderUniformBuffer, 0, renderData);

    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setBindGroup(0, this.renderBindGroup);

    // 6 вершин на одну частицу: 2 треугольника billboard-квадрата
    passEncoder.draw(this.maxParticles * 6);
  }
}