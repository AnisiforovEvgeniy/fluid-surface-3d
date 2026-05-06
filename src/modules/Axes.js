export class Axes {
  constructor(device, presentationFormat, length = 5) {
    this.device = device;
    this.presentationFormat = presentationFormat;
    this.length = length;

    this.pipeline = null;
    this.vertexBuffer = null;
    this.vertexCount = 0;
  }

  async init() {
    await this.createShaderModule();
    this.createPipeline();
    this.createGeometry();
  }

  async createShaderModule() {
    const vertexShaderCode = await fetch("./shaders/axes/axes_vertex.wgsl").then((r) => r.text());
    const fragmentShaderCode = await fetch("./shaders/axes/axes_fragment.wgsl").then((r) => r.text());

    this.shaderModule = this.device.createShaderModule({
      code: vertexShaderCode + fragmentShaderCode,
    });
  }

  createPipeline() {
    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.shaderModule,
        entryPoint: "axes_vertex",
        buffers: [
          {
            arrayStride: 28,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
              {
                shaderLocation: 1,
                offset: 12,
                format: "float32x4",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "axes_fragment",
        targets: [
          {
            format: this.presentationFormat,
          },
        ],
      },
      primitive: {
        topology: "line-list",
      },
      multisample: {
        count: 4,
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }

  createGeometry() {
    const l = this.length;

    const vertices = new Float32Array([
      // Z — blue
      0, 0, 0, 0, 0.45, 1, 1,
      l, 0, 0, 0, 0.45, 1, 1,

      // X — red
      0, 0, 0, 1, 0, 0, 1,
      0, l, 0, 1, 0, 0, 1,

      // Y — green
      0, 0, 0, 0, 1, 0, 0,
      0, 0, l, 0, 1, 0, 0,
    ]);

    this.vertexCount = 6;

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();
  }

  render(passEncoder, bindGroup) {
    if (!this.pipeline || !this.vertexBuffer) return;

    passEncoder.setPipeline(this.pipeline);

    if (bindGroup) {
      passEncoder.setBindGroup(0, bindGroup);
    }

    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.draw(this.vertexCount);
  }

  destroy() {
    this.vertexBuffer?.destroy();
  }
}