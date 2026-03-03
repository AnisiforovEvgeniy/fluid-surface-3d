import { useEffect, useRef, useCallback, useState } from "react";
import { Mesh } from "./modules/Mesh.js";
import { Grid } from "./modules/Grid.js";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import { useControlPanel } from "./context/controlPanelContext.jsx";
import "./index.css";
import { OrbitCamera } from "./modules/OrbitCamera.js";


function App() {
  const canvasRef = useRef(null);
  const { settings } = useControlPanel();

  const meshRef = useRef(null);
  const gridRef = useRef(null);
  const deviceRef = useRef(null);
  const contextRef = useRef(null);
  const presentationFormatRef = useRef(null);
  const multisampleTextureRef = useRef(null);
  const uniformBufferRef = useRef(null);
  const meshBindGroupRef = useRef(null);
  const gridBindGroupRef = useRef(null); 
  const cameraRef = useRef(null);

  const isRebuildingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const createMultisampleTexture = useCallback(
    (device, presentationFormat, canvas) => {
      multisampleTextureRef.current?.destroy();
      multisampleTextureRef.current = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount: 4,
        format: presentationFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    },
    [],
  );

const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !deviceRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      createMultisampleTexture(
        deviceRef.current,
        presentationFormatRef.current,
        canvas,
      );
    }
  }, [createMultisampleTexture]);

  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    const device = deviceRef.current;
    const context = contextRef.current;

    if (!canvas || !device || !context) return;

    cameraRef.current?.update(device);

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const multisampleView = multisampleTextureRef.current.createView();

    const renderPassDescriptor = {
      colorAttachments: [
        {
          view: multisampleView,
          resolveTarget: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: "clear",
          storeOp: "discard",
        },
      ],
      sampleCount: 4,
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    meshRef.current?.render(passEncoder, meshBindGroupRef.current);

    if (settings.showGrid && gridRef.current) {
      gridRef.current.render(passEncoder, gridBindGroupRef.current);
    }

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }, [settings.showGrid]);

  useEffect(() => {
    if (!isInitialized) return;

    let animationFrameId;
    const animate = () => {
      renderScene();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInitialized, renderScene]);

  const rebuildScene = useCallback(async () => {
    if (isRebuildingRef.current) return;
    const device = deviceRef.current;
    if (!device) return;
    
    isRebuildingRef.current = true;
    try {
      meshRef.current?.destroy();
      gridRef.current?.destroy();

      meshRef.current = new Mesh(device, presentationFormatRef.current, settings.countCell, settings.sizeCell);
      await meshRef.current.init();
      
      if (!meshRef.current?.pipeline) {
        console.error("Mesh pipeline не создан");
        return;
      }

      meshBindGroupRef.current = device.createBindGroup({
        layout: meshRef.current.pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: { buffer: uniformBufferRef.current }, 
        }],
      });

      gridRef.current = new Grid(device, presentationFormatRef.current, settings.countCell, settings.sizeCell);
      await gridRef.current.init();
      
      gridBindGroupRef.current = device.createBindGroup({
        layout: gridRef.current.pipeline.getBindGroupLayout(0), 
        entries: [{
          binding: 0,
          resource: { buffer: uniformBufferRef.current }, 
        }],
      });
      
      if (!gridRef.current?.pipeline) {
        console.error("Grid pipeline не создан");
        return;
      }

      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
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
          sampleCount: 4,
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        
        meshRef.current.render(passEncoder, meshBindGroupRef.current);
        
        if (settings.showGrid && gridRef.current?.pipeline) {
          gridRef.current.render(passEncoder, meshBindGroupRef.current);
        }
        
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
      }
    } catch (error) {
      console.error("Ошибка при пересоздании сцены:", error);
    } finally {
      isRebuildingRef.current = false;
    }
  }, [settings.countCell, settings.sizeCell, settings.showGrid]);

  useEffect(() => {
    if (deviceRef.current && isInitialized) {
      rebuildScene(); 
    }
  }, [settings.countCell, settings.sizeCell, settings.showGrid, rebuildScene, isInitialized]);

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

        const context = canvas.getContext("webgpu");
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        presentationFormatRef.current = presentationFormat;
        contextRef.current = context;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(canvas.clientWidth * dpr);
        canvas.height = Math.floor(canvas.clientHeight * dpr);

        context.configure({
          device: device,
          format: presentationFormat,
          alphaMode: "opaque",
        });

        createMultisampleTexture(device, presentationFormat, canvas);

        const uniformBufferSize = 64;
        uniformBufferRef.current = device.createBuffer({
          size: uniformBufferSize,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        meshRef.current = new Mesh(device, presentationFormat, settings.countCell, settings.sizeCell);
        await meshRef.current.init();

        meshBindGroupRef.current = device.createBindGroup({
          layout: meshRef.current.pipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: { buffer: uniformBufferRef.current },
          }],
        });

        cameraRef.current = new OrbitCamera(canvas, uniformBufferRef.current);
        cameraRef.current.update(device);

        gridRef.current = new Grid(device, presentationFormat, settings.countCell, settings.sizeCell);
        await gridRef.current.init();

        gridBindGroupRef.current = device.createBindGroup({
          layout: gridRef.current.pipeline.getBindGroupLayout(0), 
          entries: [{
            binding: 0,
            resource: { buffer: uniformBufferRef.current }, 
          }],
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("Ошибка инициализации WebGPU:", error);
      }
    };

    initWebGPU();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      meshRef.current?.destroy();
      gridRef.current?.destroy();
      multisampleTextureRef.current?.destroy();
    };
  }, []);

  return (
    <div className="canvas-container">
      <canvas id="canvas" ref={canvasRef}></canvas>
      <ControlPanel />
    </div>
  );
}

export default App;