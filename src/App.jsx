import { useEffect, useRef } from 'react';
import { Mesh } from './Mesh';
import { Grid } from './Grid';
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
    let presentationFormat;
    let multisampleTexture;
    let mesh;
    let grid;
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

        const gridSize = 4;
        const cellSize = 0.2;
        
        mesh = new Mesh(device, presentationFormat, sampleCount, gridSize, cellSize);
        await mesh.init();

        grid = new Grid(device, presentationFormat, sampleCount, gridSize, cellSize);
        await grid.init();

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
        
        mesh.render(passEncoder);
        grid.render(passEncoder);
        
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
      mesh?.destroy();
      grid?.destroy();
      multisampleTexture?.destroy();
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas id="canvas" ref={canvasRef}></canvas>
    </div>
  );
}

export default App;