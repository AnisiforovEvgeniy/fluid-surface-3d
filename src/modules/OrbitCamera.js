import { mat4 } from 'gl-matrix';
import { store } from '../store';

export class OrbitCamera {
  constructor(canvas, uniformBuffer) {
    this.canvas = canvas;
    this.uniformBuffer = uniformBuffer;
    
    this.azimuth = store.camera.azimuthCamera;
    this.elevation = Math.PI / 4;
    this.radius = store.camera.radiusCamera;

    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.viewProjectionMatrix = mat4.create();
    this.viewProjectionMatrixNoModel = mat4.create(); // ← НОВОЕ (для частиц)
    this.modelMatrix = mat4.create(); 
    
    mat4.rotateX(this.modelMatrix, this.modelMatrix, -Math.PI / 2);

    this.isDragging = false;
    this.previousMouseX = 0;

    this.initEventListeners();
  }

  initEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.previousMouseX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - this.previousMouseX;
      this.azimuth += deltaX * 0.005;
      
      store.camera.azimuthCamera(this.azimuth)

      this.previousMouseX = e.clientX;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      const newRadius = this.radius * (e.deltaY > 0 ? 1.1 : 0.9);
      this.radius = Math.max(1.0, Math.min(40.0, newRadius));
      
      store.camera.radiusCamera(this.radius)
    }, { passive: false });
  }

  update(device) {
    if (!this.isDragging) {
      this.azimuth = store.camera.azimuthCamera;
      this.radius = store.camera.radiusCamera;
    }

    const x = this.radius * Math.cos(this.elevation) * Math.sin(this.azimuth);
    const y = this.radius * Math.sin(this.elevation);
    const z = this.radius * Math.cos(this.elevation) * Math.cos(this.azimuth);
    
    const eye = [x, y, z];
    const center = [0, 0, 0];
    const up = [0, 1, 0];

    mat4.perspective(this.projectionMatrix, Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100.0);
    mat4.lookAt(this.viewMatrix, eye, center, up);
    
    const viewProjection = mat4.create();
    mat4.multiply(viewProjection, this.projectionMatrix, this.viewMatrix);
    
    mat4.multiply(this.viewProjectionMatrix, viewProjection, this.modelMatrix);
    
    mat4.copy(this.viewProjectionMatrixNoModel, viewProjection);

    device.queue.writeBuffer(this.uniformBuffer, 0, this.viewProjectionMatrix);
  }

  getViewProjectionNoModel() {
    return this.viewProjectionMatrixNoModel;
  }
}