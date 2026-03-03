import { mat4 } from 'gl-matrix';

export class OrbitCamera {
  constructor(canvas, uniformBuffer) {
    this.canvas = canvas;
    this.uniformBuffer = uniformBuffer; 
    
    this.azimuth = 0;
    this.elevation = Math.PI / 4;
    this.radius = 7;

    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.viewProjectionMatrix = mat4.create();
    this.modelMatrix = mat4.create(); 
    
    mat4.rotateX(this.modelMatrix, this.modelMatrix, -Math.PI / 2);

    this.isDragging = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;

    this.initEventListeners();
  }

  initEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this.isDragging = true;
      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      // Горизонтальное вращение
      const deltaX = e.clientX - this.previousMouseX;
      this.azimuth += deltaX * 0.005;

      // Вертикальное вращение (с ограничениями)
      // const deltaY = e.clientY - this.previousMouseY;
      // this.elevation -= deltaY * 0.005;
      // this.elevation = Math.max(0.1, Math.min(Math.PI - 0.1, this.elevation));

      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('wheel', (e) => {
      this.radius *= e.deltaY > 0 ? 1.1 : 0.9;
      this.radius = Math.max(1.0, Math.min(20.0, this.radius));
    }, { passive: true });
  }

  update(device) {
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

    device.queue.writeBuffer(this.uniformBuffer, 0, this.viewProjectionMatrix);
  }
}