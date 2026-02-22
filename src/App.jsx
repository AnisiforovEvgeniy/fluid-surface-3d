import { useEffect, useRef, useState, useCallback } from 'react';
import { Mesh } from './Mesh';
import { Grid } from './Grid';
import ControlPanel from './components/ControlPanel/ControlPanel';
import './index.css';

function App() {
  const canvasRef = useRef(null);
  
  const [countCell, setCountCell] = useState(7);
  const [sizeCell, setSizeCell] = useState(0.2);
  
  const meshRef = useRef(null);
  const gridRef = useRef(null);
  const deviceRef = useRef(null);
  const contextRef = useRef(null);
  const presentationFormatRef = useRef(null);
  const multisampleTextureRef = useRef(null);
  const sampleCount = 4;
  
  const isRebuildingRef = useRef(false);

  const createMultisampleTexture = useCallback((device, presentationFormat, canvas) => {
    multisampleTextureRef.current?.destroy();
    multisampleTextureRef.current = device.createTexture({
      size: [canvas.width, canvas.height],
      sampleCount: sampleCount,
      format: presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !deviceRef.current) return;
    
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      createMultisampleTexture(deviceRef.current, presentationFormatRef.current, canvas);
    }
  }, [createMultisampleTexture]);

  const rebuildScene = useCallback(async () => {
    if (isRebuildingRef.current) return;
    
    const device = deviceRef.current;
    if (!device) return;

    isRebuildingRef.current = true;

    try {
      meshRef.current?.destroy();
      gridRef.current?.destroy();

      meshRef.current = new Mesh(device, presentationFormatRef.current, sampleCount, countCell, sizeCell);
      await meshRef.current.init();

      gridRef.current = new Grid(device, presentationFormatRef.current, sampleCount, countCell, sizeCell);
      await gridRef.current.init();

      renderScene();
    } catch (error) {
      console.error("Ошибка при пересоздании сцены:", error);
    } finally {
      isRebuildingRef.current = false;
    }
  }, [countCell, sizeCell]);

  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    const device = deviceRef.current;
    const context = contextRef.current;
    
    if (!canvas || !device || !context) return;

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const multisampleView = multisampleTextureRef.current.createView();

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
    
    meshRef.current?.render(passEncoder);
    gridRef.current?.render(passEncoder);
    
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }, []);

  useEffect(() => {
    if (deviceRef.current) {
      rebuildScene();
    }
  }, [countCell, sizeCell, rebuildScene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!navigator.gpu) {
      alert("WebGPU не поддерживается в этом браузере");
      return;
    }

    const initWebGPU = async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("Не удалось получить адаптер GPU");
        
        const device = await adapter.requestDevice();
        deviceRef.current = device;
        
        const context = canvas.getContext('webgpu');
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        presentationFormatRef.current = presentationFormat;
        contextRef.current = context;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(canvas.clientWidth * dpr);
        canvas.height = Math.floor(canvas.clientHeight * dpr);

        context.configure({
          device: device,
          format: presentationFormat,
          alphaMode: 'opaque',
        });

        createMultisampleTexture(device, presentationFormat, canvas);

        meshRef.current = new Mesh(device, presentationFormat, sampleCount, countCell, sizeCell);
        await meshRef.current.init();

        gridRef.current = new Grid(device, presentationFormat, sampleCount, countCell, sizeCell);
        await gridRef.current.init();

        renderScene();

      } catch (error) {
        console.error("Ошибка инициализации WebGPU:", error);
      }
    };

    initWebGPU();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      meshRef.current?.destroy();
      gridRef.current?.destroy();
      multisampleTextureRef.current?.destroy();
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas id="canvas" ref={canvasRef}></canvas>
      <ControlPanel 
        countCell={countCell}
        setCountCell={setCountCell}
        sizeCell={sizeCell}
        setSizeCell={setSizeCell}
      />
    </div>
  );
}

export default App;