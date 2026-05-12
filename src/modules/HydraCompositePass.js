export class HydraCompositePass {
  constructor(device, presentationFormat) {
    this.device = device;
    this.presentationFormat = presentationFormat;

    this.width = 1;
    this.height = 1;

    this.msaaTexture = null;
    this.colorTexture = null;
    this.depthTexture = null;

    this.sampler = null;
    this.pipeline = null;
    this.bindGroup = null;
  }

  async init(width, height) {
    this.createTextures(width, height);
    this.createSampler();

    const [vertexCode, fragmentCode] = await Promise.all([
      fetch("./shaders/hydra/hydra_composite_vertex.wgsl").then((r) =>
        r.text()
      ),
      fetch("./shaders/hydra/hydra_composite_fragment.wgsl").then((r) =>
        r.text()
      ),
    ]);

    const shaderModule = this.device.createShaderModule({
      code: vertexCode + "\n" + fragmentCode,
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",

      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
      },

      fragment: {
        module: shaderModule,
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

      // ВАЖНО: основной render pass у тебя MSAA x4,
      // поэтому composite pipeline тоже должен быть x4.
      multisample: {
        count: 4,
      },

      // ВАЖНО: основной render pass имеет depth24plus,
      // значит pipeline тоже должен объявить depthStencil.
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "always",
        format: "depth24plus",
      },
    });

    this.createBindGroup();
  }

  createTextures(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    this.msaaTexture?.destroy();
    this.colorTexture?.destroy();
    this.depthTexture?.destroy();

    this.msaaTexture = this.device.createTexture({
      size: [this.width, this.height],
      sampleCount: 4,
      format: this.presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.colorTexture = this.device.createTexture({
      size: [this.width, this.height],
      format: this.presentationFormat,
      usage:
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.TEXTURE_BINDING,
    });

    this.depthTexture = this.device.createTexture({
      size: [this.width, this.height],
      sampleCount: 4,
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  createSampler() {
    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });
  }

  createBindGroup() {
    if (!this.pipeline || !this.colorTexture || !this.sampler) return;

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: this.colorTexture.createView(),
        },
      ],
    });
  }

  resize(width, height) {
    if (this.width === width && this.height === height) return;

    this.createTextures(width, height);
    this.createBindGroup();
  }

  getHydraRenderPassDescriptor() {
    return {
      colorAttachments: [
        {
          view: this.msaaTexture.createView(),
          resolveTarget: this.colorTexture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "discard",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: "load",
        depthStoreOp: "discard",
      },
    };
  }

  getHydraDepthPrepassDescriptor() {
    return {
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  render(passEncoder) {
    if (!this.pipeline || !this.bindGroup) return;

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.draw(3);
  }

  destroy() {
    this.msaaTexture?.destroy();
    this.colorTexture?.destroy();
    this.depthTexture?.destroy();

    this.msaaTexture = null;
    this.colorTexture = null;
    this.depthTexture = null;
    this.bindGroup = null;
    this.pipeline = null;
    this.sampler = null;
  }
}