import { useEffect, useRef } from 'react';
import './index.css';

function App() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!navigator.gpu) {
      alert("WebGPU не поддерживается в этом браузере");
      return;
    }

    let device;
    let context;
    let vertexBuffer;
    let presentationFormat;
    let multisampleTexture;
    const sampleCount = 4;

    const createMultisampleTexture = () => {
      if (!device || !presentationFormat) return;
      
      multisampleTexture?.destroy();
      multisampleTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount: sampleCount,
        format: presentationFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        createMultisampleTexture();
      }
    };

    const initWebGPU = async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("Не удалось получить адаптер GPU");
        
        device = await adapter.requestDevice();
        
        context = canvas.getContext('webgpu');
        presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(canvas.clientWidth * dpr);
        canvas.height = Math.floor(canvas.clientHeight * dpr);

        context.configure({
          device: device,
          format: presentationFormat,
          alphaMode: 'opaque',
        });

        createMultisampleTexture();

        const vertexShaderCode = await fetch('./shaders/mesh/mesh_vertex.wgsl').then(r => r.text());
        const fragmentShaderCode = await fetch('./shaders/mesh/mesh_fragment.wgsl').then(r => r.text());

        const shaderModule = device.createShaderModule({
          code: vertexShaderCode + fragmentShaderCode,
        });

        const pipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: {
            module: shaderModule,
            entryPoint: 'mesh_vertex',
            buffers: [{
              arrayStride: 12, 
              attributes: [
                {
                  shaderLocation: 0,
                  offset: 0,
                  format: 'float32x3', 
                },
              ],
            }],
          },
          fragment: {
            module: shaderModule,
            entryPoint: 'mesh_fragment',
            targets: [{
              format: presentationFormat,
            }],
          },
          primitive: {
            topology: 'triangle-list',
          },
          multisample: {
            count: sampleCount,
          },
        });

        const vertices = new Float32Array([
          0.0,  0.5,  0.0,
          -0.5, -0.5,  0.0,
          0.5, -0.5,  0.0,
        ]);

        vertexBuffer = device.createBuffer({
          size: vertices.byteLength,
          usage: GPUBufferUsage.VERTEX,
          mappedAtCreation: true,
        });
        new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
        vertexBuffer.unmap();

        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();
        const multisampleView = multisampleTexture.createView();

        const renderPassDescriptor = {
          colorAttachments: [{
            view: multisampleView,
            resolveTarget: textureView,
            clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'discard',
          }],
          sampleCount: sampleCount,
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setVertexBuffer(0, vertexBuffer);
        passEncoder.draw(3);
        passEncoder.end();

        device.queue.submit([commandEncoder.finish()]);

      } catch (error) {
        console.error("Ошибка инициализации WebGPU:", error);
      }
    };

    initWebGPU();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (vertexBuffer) vertexBuffer.destroy();
      if (multisampleTexture) multisampleTexture.destroy();
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas id="canvas" ref={canvasRef}></canvas>
    </div>
  );
}

export default App;