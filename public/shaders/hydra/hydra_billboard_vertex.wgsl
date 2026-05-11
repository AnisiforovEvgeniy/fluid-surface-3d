struct Particle {
  pos: vec4f,
  vel: vec4f,
};

struct RenderUniforms {
  viewProjectionMatrix: mat4x4f,
  particleRadius: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
  baseColor: vec4f,
};

@group(0) @binding(0)
var<storage, read> particles: array<Particle>;

@group(0) @binding(1)
var<uniform> uniforms: RenderUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) localUv: vec2f,
  @location(1) color: vec4f,
  @location(2) speed: f32,
  @location(3) lifetime: f32,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  let particleIndex = vertexIndex / 6u;
  let cornerIndex = vertexIndex % 6u;

  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f( 1.0, -1.0),
    vec2f(-1.0,  1.0),

    vec2f(-1.0,  1.0),
    vec2f( 1.0, -1.0),
    vec2f( 1.0,  1.0)
  );

  let particle = particles[particleIndex];
  let lifetime = particle.pos.w;

  var out: VertexOutput;

  if (lifetime <= 0.0) {
    out.position = vec4f(9999.0, 9999.0, 9999.0, 1.0);
    out.localUv = vec2f(0.0);
    out.color = vec4f(0.0);
    out.speed = 0.0;
    out.lifetime = 0.0;
    return out;
  }

  let worldPos = vec4f(particle.pos.xyz, 1.0);
  var clipPos = uniforms.viewProjectionMatrix * worldPos;

  let corner = corners[cornerIndex];

  // Чем быстрее частица, тем чуть вытянутее/крупнее визуальный след.
  let speed = length(particle.vel.xyz);
  let speedBoost = clamp(speed * 0.025, 0.0, 0.8);
  let radius = uniforms.particleRadius * (1.0 + speedBoost);

  let offset = corner * radius * clipPos.w;

  clipPos = vec4f(
    clipPos.x + offset.x,
    clipPos.y + offset.y,
    clipPos.z,
    clipPos.w
  );

  out.position = clipPos;
  out.localUv = corner;
  out.color = uniforms.baseColor;
  out.speed = speed;
  out.lifetime = lifetime;

  return out;
}