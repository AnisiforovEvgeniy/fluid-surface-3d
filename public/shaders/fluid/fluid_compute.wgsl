// shaders/fluid/fluid_compute.wgsl

struct Particle {
  pos: vec4f,
  vel: vec4f,
}

struct FluidUniforms {
  deltaTime: f32,      // 0-3
  gravity: f32,        // 4-7
  spawnRate: f32,      // 8-11
  _padding1: f32,      // 12-15 (выравнивание до 16)
  spawnPos: vec3f,     // 16-27 (x, y, z)
  _padding2: f32,      // 28-31 (выравнивание до 16)
  maxLifetime: f32,    // 32-35
  particleCount: u32,  // 36-39
  time: f32,           // 40-43
  _padding3: f32,      // 44-47 (итого 48 байт)
}

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uniforms: FluidUniforms;

fn hash(u: u32) -> f32 {
  var x = u * 2654435761u;
  x = ((x >> 16u) ^ x) * 0x45d9f3bu;
  x = ((x >> 16u) ^ x) * 0x45d9f3bu;
  x = (x >> 16u) ^ x;
  return f32(x) / 4294967295.0;
}

@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) id: vec3u) {
  let idx = id.x;
  if (idx >= uniforms.particleCount) { return; }

  var p = particles[idx];
  let dt = uniforms.deltaTime;

  // === СПАВН ===
  if (p.pos.w <= 0.0) {
    let spawnTime = f32(idx) / uniforms.spawnRate;
    let cycleTime = fract((uniforms.time - spawnTime) * uniforms.spawnRate / f32(uniforms.particleCount));
    
    if (cycleTime < dt * 2.0) {
      p.pos = vec4f(
        uniforms.spawnPos.x + (hash(idx) - 0.5) * 0.5,
        uniforms.spawnPos.y,
        uniforms.spawnPos.z + (hash(idx + 1u) - 0.5) * 0.5,
        uniforms.maxLifetime
      );
      p.vel = vec4f(
        (hash(idx + 2u) - 0.5) * 1.0,
        -0.5,
        (hash(idx + 3u) - 0.5) * 1.0,
        1.0
      );
    }
  }

  // === ФИЗИКА ===
  if (p.pos.w > 0.0) {
    p.vel.y -= uniforms.gravity * dt;
    p.pos = vec4f(p.pos.xyz + p.vel.xyz * dt, p.pos.w - dt);
    
    if (p.pos.y < -20.0 || p.pos.w <= 0.0) {
      p.pos = vec4f(0.0);
      p.vel = vec4f(0.0);
    }
  }

  particles[idx] = p;
}