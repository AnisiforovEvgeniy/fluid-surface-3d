export class Grid {
  constructor(device, presentationFormat, gridSize, cellSize) {
    this.device = device;
    this.presentationFormat = presentationFormat;
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.pipeline = null;
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.indexCount = 0;
  }

  async init() {
    await this.createShaderModule();
    this.createPipeline();
    this.createWireframe();
  }

  async createShaderModule() {
    const vertexShaderCode = await fetch('./shaders/grid/grid_vertex.wgsl').then(r => r.text());
    const fragmentShaderCode = await fetch('./shaders/grid/grid_fragment.wgsl').then(r => r.text());

    this.shaderModule = this.device.createShaderModule({
      code: vertexShaderCode + fragmentShaderCode,
    });
  }

  createPipeline() {
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.shaderModule,
        entryPoint: 'grid_vertex',
        buffers: [{
          arrayStride: 20, 
          attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3', 
          }, {
            shaderLocation: 1,
            offset: 12,
            format: 'float32x2', 
          }],
        }],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: 'grid_fragment',
        targets: [{
          format: this.presentationFormat,
        }],
      },
      primitive: {
        topology: 'line-list',
      },
      multisample: {
        count: 4,
      },
    });
  }

  createWireframe() {
    const vertices = [];
    const indices = [];
    
    const offsetX = (this.gridSize * this.cellSize) / 2;
    const offsetY = (this.gridSize * this.cellSize) / 2;

    for (let y = 0; y <= this.gridSize; y++) {
      for (let x = 0; x <= this.gridSize; x++) {
        const posX = x * this.cellSize - offsetX;
        const posY = y * this.cellSize - offsetY;
        const posZ = 0.0;
        
        const u = x / this.gridSize;
        const v = y / this.gridSize;
        
        vertices.push(posX, posY, posZ, u, v);
      }
    }

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const topLeft = y * (this.gridSize + 1) + x;
        const topRight = topLeft + 1;
        const bottomLeft = (y + 1) * (this.gridSize + 1) + x;
        const bottomRight = bottomLeft + 1;

        indices.push(topLeft, bottomLeft);     
        indices.push(bottomLeft, topRight);     
        indices.push(topRight, topLeft);       

        indices.push(topRight, bottomLeft);
        indices.push(bottomLeft, bottomRight); 
        indices.push(bottomRight, topRight);   
      }
    }

    const vertexData = new Float32Array(vertices);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
    this.vertexBuffer.unmap();

    const indexData = new Uint16Array(indices);
    this.indexBuffer = this.device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indexData);
    this.indexBuffer.unmap();

    this.indexCount = indices.length;
  }

  render(passEncoder) {
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, 'uint16');
    passEncoder.drawIndexed(this.indexCount);
  }

  destroy() {
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
  }
}