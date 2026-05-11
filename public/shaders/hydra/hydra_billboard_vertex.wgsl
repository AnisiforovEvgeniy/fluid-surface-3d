struct Particle {
  pos: vec4f,
  vel: vec4f,
};

struct RenderUniforms {
  viewProjectionMatrix: mat4x4f,

  particleRadius: f32,
  foamIntensity: f32,
  foamThreshold: f32,
  highlightIntensity: f32,

  baseColor: vec4f,

  stretch: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
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

  @location(4) foamIntensity: f32,
  @location(5) foamThreshold: f32,
  @location(6) highlightIntensity: f32,
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

    out.foamIntensity = 0.0;
    out.foamThreshold = 0.0;
    out.highlightIntensity = 0.0;

    return out;
  }

  let worldPos = vec4f(particle.pos.xyz, 1.0);
  var clipPos = uniforms.viewProjectionMatrix * worldPos;

  let speed = length(particle.vel.xyz);
  let corner = corners[cornerIndex];

  var dir = vec2f(0.0, 1.0);

  if (speed > 0.001) {
    let nextWorld = vec4f(particle.pos.xyz + normalize(particle.vel.xyz) * 0.15, 1.0);
    let nextClip = uniforms.viewProjectionMatrix * nextWorld;

    let currentNdc = clipPos.xy / clipPos.w;
    let nextNdc = nextClip.xy / nextClip.w;

    let screenDir = nextNdc - currentNdc;

    if (length(screenDir) > 0.00001) {
      dir = normalize(screenDir);
    }
  }

  let side = vec2f(-dir.y, dir.x);

  let speedBoost = clamp(speed * 0.02, 0.0, 1.0);
  let longRadius = uniforms.particleRadius * uniforms.stretch * (1.0 + speedBoost);
  let sideRadius = uniforms.particleRadius;

  let offsetNdc =
    side * corner.x * sideRadius +
    dir * corner.y * longRadius;

  clipPos = vec4f(
    clipPos.x + offsetNdc.x * clipPos.w,
    clipPos.y + offsetNdc.y * clipPos.w,
    clipPos.z,
    clipPos.w
  );

  out.position = clipPos;

  out.localUv = corner;
  out.color = uniforms.baseColor;
  out.speed = speed;
  out.lifetime = lifetime;

  out.foamIntensity = uniforms.foamIntensity;
  out.foamThreshold = uniforms.foamThreshold;
  out.highlightIntensity = uniforms.highlightIntensity;

  return out;
}