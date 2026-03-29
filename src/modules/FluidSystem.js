// src/modules/FluidSystem.js
export class FluidSystem {
  constructor(device, presentationFormat, maxParticles = 50000) {
    this.device = device;
    this.presentationFormat = presentationFormat;
    this.maxParticles = maxParticles;

    this.computePipeline = null;
    this.renderPipeline = null;

    this.computeModule = null;
    this.renderModule = null;

    this.particleBuffer = null;
    this.computeUniformBuffer = null;
    this.renderUniformBuffer = null;

    this.computeBindGroup = null;
    this.renderBindGroup = null;

    this.time = 0;
    this.spawnRate = 2000;
  }

  async init() {
    await this.createShaderModules();
    this.createPipelines();
    this.createBuffers();
    this.createBindGroups();
  }

  async createShaderModules() {
    const computeCode = await fetch("./shaders/fluid/fluid_compute.wgsl").then((r) => r.text());
    this.computeModule = this.device.createShaderModule({ code: computeCode });

    const [vertexCode, fragmentCode] = await Promise.all([
      fetch("./shaders/fluid/fluid_vertex.wgsl").then((r) => r.text()),
      fetch("./shaders/fluid/fluid_fragment.wgsl").then((r) => r.text()),
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
                dstFactor: "one",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "point-list",
      },
      multisample: { count: 4 },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }

  createBuffers() {
    // Particle = vec4(pos) + vec4(vel) = 32 bytes
    const particleSize = 32;

    this.particleBuffer = this.device.createBuffer({
      size: this.maxParticles * particleSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
    });

    const initialData = new Float32Array(this.maxParticles * 8);
    this.device.queue.writeBuffer(this.particleBuffer, 0, initialData);

    // 4 vec4 = 64 bytes, безопасное выравнивание под uniform
    this.computeUniformBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // mat4 (64) + particleSize (4) + pad (12) + color vec4 (16) = 96 bytes
    this.renderUniformBuffer = this.device.createBuffer({
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  createBindGroups() {
    this.computeBindGroup = this.device.createBindGroup({
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.computeUniformBuffer } },
      ],
    });

    this.renderBindGroup = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.renderUniformBuffer } },
      ],
    });
  }

  update(deltaTime, settings = {}) {
    this.time += deltaTime;
    this.spawnRate = settings.spawnRate ?? this.spawnRate;

    const gridSize = settings.gridSize ?? 20;
    const cellSize = settings.cellSize ?? 0.2;
    const halfExtent = (gridSize * cellSize) * 0.5;

    const formSurface = settings.formSurface ?? 1;

    const spawnPos = settings.spawnPos ?? [0.0, 10.0, 0.0];
    const gravity = settings.gravity ?? 9.81;

    const maxLifetime = settings.maxLifetime ?? 1000000.0;
    const restitution = settings.restitution ?? 0.35;
    const friction = settings.friction ?? 0.985;
    const stickThreshold = settings.stickThreshold ?? 1.15;
    const collisionOffset = settings.collisionOffset ?? 0.03;

    // 4 vec4 = 16 float
    const computeData = new Float32Array(16);

    // params0
    computeData[0] = deltaTime;
    computeData[1] = gravity;
    computeData[2] = this.spawnRate;
    computeData[3] = maxLifetime;

    // spawn / particle count
    computeData[4] = spawnPos[0];
    computeData[5] = spawnPos[1];
    computeData[6] = spawnPos[2];
    computeData[7] = this.maxParticles;

    // surface
    computeData[8] = formSurface;
    computeData[9] = halfExtent;
    computeData[10] = halfExtent;
    computeData[11] = collisionOffset;

    // time / collision params
    computeData[12] = this.time;
    computeData[13] = restitution;
    computeData[14] = friction;
    computeData[15] = stickThreshold;

    this.device.queue.writeBuffer(this.computeUniformBuffer, 0, computeData);

    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();

    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.computeBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(this.maxParticles / 64));

    computePass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  render(passEncoder, viewProjectionMatrix, settings = {}) {
    const particleSize = settings.particleSize ?? 1.0;
    const baseColor = settings.baseColor ?? [0.2, 0.6, 1.0, 1.0];

    const renderData = new Float32Array(24);
    renderData.set(viewProjectionMatrix, 0);

    renderData[16] = particleSize;
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
    passEncoder.draw(this.maxParticles);
  }

  destroy() {
    this.particleBuffer?.destroy();
    this.computeUniformBuffer?.destroy();
    this.renderUniformBuffer?.destroy();
  }
}