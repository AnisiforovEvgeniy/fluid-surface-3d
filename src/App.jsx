import { useEffect, useRef, useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { Mesh } from "./modules/Mesh.js";
import { Grid } from "./modules/Grid.js";
import { OrbitCamera } from "./modules/OrbitCamera.js";
import { FluidSystem } from "./modules/FluidSystem.js";
import { useStore } from "./hook/useStore.js";
import ControlPanel from "./components/ControlPanel/ControlPanel";
import "./index.css";
import TensionLegend from "./components/TensionLegend/TensionLegend.jsx";

function App() {
  const canvasRef = useRef(null);
  const store = useStore();
  const { settings, formSurface, fluid } = store;

  const meshRef = useRef(null);
  const gridRef = useRef(null);
  const deviceRef = useRef(null);
  const contextRef = useRef(null);
  const presentationFormatRef = useRef(null);
  const multisampleTextureRef = useRef(null);
  const depthTextureRef = useRef(null);
  const uniformBufferRef = useRef(null);
  const meshBindGroupRef = useRef(null);
  const gridBindGroupRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fluidRef = useRef(null);

  const isRebuildingRef = useRef(false);
  const isReadyRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const createMultisampleTexture = useCallback((device, presentationFormat, canvas) => {
    multisampleTextureRef.current?.destroy();
    multisampleTextureRef.current = device.createTexture({
      size: [canvas.width, canvas.height],
      sampleCount: 4,
      format: presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }, []);

  const createDepthTexture = useCallback((device, canvas) => {
    depthTextureRef.current?.destroy();
    depthTextureRef.current = device.createTexture({
      size: [canvas.width, canvas.height],
      sampleCount: 4,
      format: "depth24plus",
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
      createDepthTexture(deviceRef.current, canvas);
      createMultisampleTexture(deviceRef.current, presentationFormatRef.current, canvas);
    }
  }, [createMultisampleTexture, createDepthTexture]);

  const updateUniformBuffer = useCallback(() => {
    if (!uniformBufferRef.current || !deviceRef.current) return;

    deviceRef.current.queue.writeBuffer(
      uniformBufferRef.current,
      64,
      new Float32Array([
        formSurface?.formSurface ?? 1,
        settings?.colorMode ?? 0,
      ])
    );
  }, [formSurface?.formSurface, settings?.colorMode]);

  const renderScene = useCallback(() => {
    if (isRebuildingRef.current || !isReadyRef.current) return;

    const canvas = canvasRef.current;
    const device = deviceRef.current;
    const context = contextRef.current;

    if (!canvas || !device || !context) return;
    if (!meshRef.current?.pipeline) return;
    if (!multisampleTextureRef.current) return;
    if (!depthTextureRef.current) return;

    cameraRef.current?.update(device);
    updateUniformBuffer();

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const multisampleView = multisampleTextureRef.current.createView();
    const depthView = depthTextureRef.current.createView();

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
      depthStencilAttachment: {
        view: depthView,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
      sampleCount: 4,
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    if (meshBindGroupRef.current) {
      meshRef.current.render(passEncoder, meshBindGroupRef.current);
    }

    if (settings.showGrid && gridRef.current?.pipeline && gridBindGroupRef.current) {
      gridRef.current.render(passEncoder, gridBindGroupRef.current);
    }

    if (fluidRef.current?.renderPipeline && fluid.fluidMode) {
      fluidRef.current.update(0.016, {
        spawnRate: 1800,
        gridSize: settings.countCell,
        cellSize: settings.sizeCell,
        formSurface: formSurface.formSurface,
        spawnPos: [0.0, 10.0, 0.0],
        gravity: 9.81,
        maxLifetime: 1000000.0,
        restitution: 0.32,
        friction: 0.985,
        stickThreshold: 1.1,
        collisionOffset: 0.03,
      });

      fluidRef.current.render(passEncoder, cameraRef.current.getViewProjectionNoModel(), {
        particleSize: 1.0,
        baseColor: [0.2, 0.6, 1.0, 1.0],
      });
    }

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }, [
    settings.showGrid,
    settings.countCell,
    settings.sizeCell,
    formSurface.formSurface,
    fluid.fluidMode,
    updateUniformBuffer,
  ]);

  useEffect(() => {
    if (!isInitialized) return;

    const animate = () => {
      renderScene();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInitialized, renderScene]);

  useEffect(() => {
    if (!deviceRef.current || !isInitialized || isRebuildingRef.current) return;

    const rebuildScene = async () => {
      isRebuildingRef.current = true;
      isReadyRef.current = false;

      try {
        meshBindGroupRef.current = null;
        gridBindGroupRef.current = null;

        meshRef.current?.destroy();
        gridRef.current?.destroy();

        const device = deviceRef.current;

        meshRef.current = new Mesh(
          device,
          presentationFormatRef.current,
          settings.countCell,
          settings.sizeCell
        );
        await meshRef.current.init();

        if (!meshRef.current?.pipeline) {
          throw new Error("Mesh pipeline не создан");
        }

        meshBindGroupRef.current = device.createBindGroup({
          layout: meshRef.current.pipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: { buffer: uniformBufferRef.current },
            },
          ],
        });

        gridRef.current = new Grid(
          device,
          presentationFormatRef.current,
          settings.countCell,
          settings.sizeCell
        );
        await gridRef.current.init();

        if (!gridRef.current?.pipeline) {
          throw new Error("Grid pipeline не создан");
        }

        gridBindGroupRef.current = device.createBindGroup({
          layout: gridRef.current.pipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: { buffer: uniformBufferRef.current },
            },
          ],
        });

        isReadyRef.current = true;
      } catch (error) {
        console.error("Ошибка при пересоздании сцены: ", error);
        isReadyRef.current = false;
      } finally {
        isRebuildingRef.current = false;
      }
    };

    rebuildScene();
  }, [settings.countCell, settings.sizeCell, isInitialized]);

  useEffect(() => {
    const canvas = canvasRef.current;
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
          device,
          format: presentationFormat,
          alphaMode: "premultiplied",
        });

        createMultisampleTexture(device, presentationFormat, canvas);
        createDepthTexture(device, canvas);

        // mat4 (64) + 2 float + padding = 80
        const uniformBufferSize = 80;
        uniformBufferRef.current = device.createBuffer({
          size: uniformBufferSize,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        meshRef.current = new Mesh(
          device,
          presentationFormat,
          settings.countCell,
          settings.sizeCell
        );
        await meshRef.current.init();

        if (!meshRef.current?.pipeline) {
          throw new Error("Mesh pipeline не создан");
        }

        meshBindGroupRef.current = device.createBindGroup({
          layout: meshRef.current.pipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: { buffer: uniformBufferRef.current },
            },
          ],
        });

        cameraRef.current = new OrbitCamera(canvas, uniformBufferRef.current);
        cameraRef.current.update(device);

        gridRef.current = new Grid(
          device,
          presentationFormat,
          settings.countCell,
          settings.sizeCell
        );
        await gridRef.current.init();

        if (!gridRef.current?.pipeline) {
          throw new Error("Grid pipeline не создан");
        }

        gridBindGroupRef.current = device.createBindGroup({
          layout: gridRef.current.pipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: { buffer: uniformBufferRef.current },
            },
          ],
        });

        fluidRef.current = new FluidSystem(device, presentationFormat, 50000);
        await fluidRef.current.init();

        isReadyRef.current = true;
        setIsInitialized(true);
      } catch (error) {
        console.error("Ошибка инициализации WebGPU: ", error);
        setIsInitialized(false);
      }
    };

    initWebGPU();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      meshRef.current?.destroy();
      gridRef.current?.destroy();
      fluidRef.current?.destroy();
      multisampleTextureRef.current?.destroy();
      depthTextureRef.current?.destroy();
      uniformBufferRef.current?.destroy();
    };
  }, [createDepthTexture, createMultisampleTexture, resizeCanvas, settings.countCell, settings.sizeCell]);

  return (
    <div className="canvas-container">
      <canvas id="canvas" ref={canvasRef}></canvas>
      <ControlPanel />
      {!!settings.colorMode && <TensionLegend/>}
    </div>
  );
}

export default observer(App);