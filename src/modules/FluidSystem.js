// modules/FluidSystem.js
export class FluidSystem {
  constructor(device, presentationFormat, maxParticles = 50000) {
    this.device = device;
    this.presentationFormat = presentationFormat;
    this.maxParticles = maxParticles;
    
    this.computePipeline = null;
    this.renderPipeline = null;
    
    // Буферы
    this.particleBuffer = null;     
    this.computeUniformBuffer = null; 
    this.renderUniformBuffer = null; 
    
    this.time = 0;
    this.spawnRate = 2000; 
  }

  async init() {
    await this.createShaderModules();
    this.createPipelines();
    this.createBuffers();
  }

  async createShaderModules() {
    const computeCode = await fetch('./shaders/fluid/fluid_compute.wgsl').then(r => r.text());
    this.computeModule = this.device.createShaderModule({ code: computeCode });

    const [vertexCode, fragmentCode] = await Promise.all([
      fetch('./shaders/fluid/fluid_vertex.wgsl').then(r => r.text()),
      fetch('./shaders/fluid/fluid_fragment.wgsl').then(r => r.text()),
    ]);
    this.renderModule = this.device.createShaderModule({ 
      code: vertexCode + fragmentCode 
    });
  }

  createPipelines() {
    this.computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.computeModule,
        entryPoint: 'update',
      },
    });

    this.renderPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.renderModule,
        entryPoint: 'vs_main',
        buffers: [],
      },
      fragment: {
        module: this.renderModule,
        entryPoint: 'fs_main',
        targets: [{
          format: this.presentationFormat,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          },
        }],
      },
      primitive: {
        topology: 'point-list',
      },
      multisample: { count: 4 },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    });
  }

    createBuffers() {
    const particleSize = 32;
    this.particleBuffer = this.device.createBuffer({
        size: this.maxParticles * particleSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
    });

    const initialData = new Float32Array(this.maxParticles * 8);
    this.device.queue.writeBuffer(this.particleBuffer, 0, initialData);

    this.computeUniformBuffer = this.device.createBuffer({
        size: 48, 
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.renderUniformBuffer = this.device.createBuffer({
        size: 96,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    }

    update(deltaTime, settings = {}) {
    this.time += deltaTime;
    this.spawnRate = settings.spawnRate ?? this.spawnRate;

    // COMPUTE DATA 
    const computeData = new Float32Array(12);
    computeData[0] = deltaTime;        // 0: deltaTime
    computeData[1] = 9.81;             // 1: gravity
    computeData[2] = this.spawnRate;   // 2: spawnRate
    computeData[3] = 0.0;              // 3: _padding1
    computeData[4] = 0.0;              // 4: spawnPos.x
    computeData[5] = 10.0;             // 5: spawnPos.y 
    computeData[6] = 0.0;              // 6: spawnPos.z
    computeData[7] = 0.0;              // 7: _padding2
    computeData[8] = 8.0;              // 8: maxLifetime
    computeData[9] = this.maxParticles; // 9: particleCount
    computeData[10] = this.time;       // 10: time
    computeData[11] = 0.0;             // 11: _padding3

    this.device.queue.writeBuffer(this.computeUniformBuffer, 0, computeData);

    // Compute pass
    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.device.createBindGroup({
        layout: this.computePipeline.getBindGroupLayout(0),
        entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.computeUniformBuffer } },
        ],
    }));
    computePass.dispatchWorkgroups(Math.ceil(this.maxParticles / 64));
    computePass.end();
    
    this.device.queue.submit([commandEncoder.finish()]);
    }

  render(passEncoder, viewProjectionMatrix, settings = {}) {
    const renderData = new Float32Array(24);
    renderData.set(viewProjectionMatrix, 0);  // 0-15: mat4x4f (64 байта)
    renderData[16] = 1;                    // 16: particleSize
    renderData[20] = 0.2;                     // 20: baseColor.r
    renderData[21] = 0.6;                     // 21: baseColor.g
    renderData[22] = 1.0;                     // 22: baseColor.b
    renderData[23] = 1.0;                     // 23: baseColor.a

    this.device.queue.writeBuffer(this.renderUniformBuffer, 0, renderData);

    passEncoder.setPipeline(this.renderPipeline);
    passEncoder.setBindGroup(0, this.device.createBindGroup({
        layout: this.renderPipeline.getBindGroupLayout(0),
        entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.renderUniformBuffer } },
        ],
    }));
    passEncoder.draw(this.maxParticles);
  }

  destroy() {
    this.particleBuffer?.destroy();
    this.computeUniformBuffer?.destroy();
    this.renderUniformBuffer?.destroy();
  }
}