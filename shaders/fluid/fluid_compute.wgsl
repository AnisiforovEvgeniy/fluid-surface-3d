struct Particle {
  pos: vec4f, // xyz + lifetime
  vel: vec4f, // xyz + unused
};

struct FluidUniforms {
  // params0
  deltaTime: f32,
  gravity: f32,
  spawnRate: f32,
  maxLifetime: f32,

  // spawn / count
  spawnPosX: f32,
  spawnPosY: f32,
  spawnPosZ: f32,
  particleCountF: f32,

  // surface
  deformationType: f32,
  halfWidth: f32,
  halfDepth: f32,
  collisionOffset: f32,

  // time / collision
  time: f32,
  restitution: f32,
  friction: f32,
  stickThreshold: f32,
};

@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uniforms: FluidUniforms;

fn hash(u: u32) -> f32 {
  var x = u * 2654435761u;
  x = ((x >> 16u) ^ x) * 0x45d9f3bu;
  x = ((x >> 16u) ^ x) * 0x45d9f3bu;
  x = (x >> 16u) ^ x;
  return f32(x) / 4294967295.0;
}

fn safeSqrt(x: f32) -> f32 {
  return sqrt(max(x, 0.0));
}

fn evalSurface(x: f32, mode: f32) -> f32 {
  if (mode == 1.0) {
    return x;
  } else if (mode == 2.0) {
    return x * x;
  } else if (mode == 3.0) {
    return x * x * x;
  } else if (mode == 4.0) {
    return abs(x);
  } else if (mode == 5.0) {
    return safeSqrt(x);
  } else if (mode == 6.0) {
    let signX = select(-1.0, 1.0, x >= 0.0);
    return signX / max(abs(x), 0.1);
  } else if (mode == 7.0) {
    return sin(x);
  }
  return x;
}

fn evalSurfaceDerivative(x: f32, mode: f32) -> f32 {
  if (mode == 1.0) {
    return 1.0;
  } else if (mode == 2.0) {
    return 2.0 * x;
  } else if (mode == 3.0) {
    return 3.0 * x * x;
  } else if (mode == 4.0) {
    if (x > 0.0) {
      return 1.0;
    } else if (x < 0.0) {
      return -1.0;
    }
    return 0.0;
  } else if (mode == 5.0) {
    return 0.5 / sqrt(max(x, 0.001));
  } else if (mode == 6.0) {
    let ax = max(abs(x), 0.1);
    let s = select(-1.0, 1.0, x >= 0.0);
    return -1.0 / (ax * ax) * s;
  } else if (mode == 7.0) {
    return cos(x);
  }
  return 1.0;
}

fn surfaceNormalWorld(x: f32, mode: f32) -> vec3f {
  let d = evalSurfaceDerivative(x, mode);
  return normalize(vec3f(-d, 1.0, 0.0));
}

fn spawnParticle(idx: u32) -> Particle {
  var p: Particle;

  let spreadX = (hash(idx) - 0.5) * 0.6;
  let spreadZ = (hash(idx + 1u) - 0.5) * 0.6;

  p.pos = vec4f(
    uniforms.spawnPosX + spreadX,
    uniforms.spawnPosY,
    uniforms.spawnPosZ + spreadZ,
    uniforms.maxLifetime
  );

  p.vel = vec4f(
    (hash(idx + 2u) - 0.5) * 0.7,
    -0.35 - hash(idx + 3u) * 0.3,
    (hash(idx + 4u) - 0.5) * 0.7,
    0.0
  );

  return p;
}

@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) id: vec3u) {
  let idx = id.x;
  let particleCount = u32(uniforms.particleCountF);

  if (idx >= particleCount) {
    return;
  }

  var p = particles[idx];
  let dt = uniforms.deltaTime;

  if (p.pos.w <= 0.0) {
    let spawnTime = f32(idx) / max(uniforms.spawnRate, 1.0);
    let cycle = fract((uniforms.time - spawnTime) * uniforms.spawnRate / max(f32(particleCount), 1.0));

    if (cycle < dt * 2.0) {
      p = spawnParticle(idx);
    }

    particles[idx] = p;
    return;
  }

  // Gravity
  p.vel.y -= uniforms.gravity * dt;

  // Integrate
  var newPos = p.pos.xyz + p.vel.xyz * dt;
  var newVel = p.vel.xyz;

  let insideSurfaceXZ =
    abs(newPos.x) <= uniforms.halfWidth &&
    abs(newPos.z) <= uniforms.halfDepth;

  if (insideSurfaceXZ) {
    let surfaceY = evalSurface(newPos.x, uniforms.deformationType);
    let penetration = surfaceY - newPos.y;

    if (penetration >= 0.0) {
      let n = surfaceNormalWorld(newPos.x, uniforms.deformationType);

      // Поднимаем частицу на поверхность с маленьким зазором
      newPos = newPos + n * (penetration + uniforms.collisionOffset);

      let vn = dot(newVel, n);
      let vN = n * vn;
      var vT = newVel - vN;

      // Если летим внутрь поверхности — отражаем
      if (vn < 0.0) {
        newVel = vT - vN * uniforms.restitution;
      }

      // Трение по касательной
      vT = (newVel - n * dot(newVel, n)) * uniforms.friction;
      newVel = vT + n * max(dot(newVel, n), 0.0);

      // Гравитация вдоль поверхности → "стекание"
      let g = vec3f(0.0, -uniforms.gravity, 0.0);
      let gT = g - n * dot(g, n);
      newVel += gT * dt * 0.9;

      // Слабый прижим к поверхности, чтобы меньше дрожало
      let speed = length(newVel);
      if (speed < uniforms.stickThreshold) {
        let tangentOnly = newVel - n * dot(newVel, n);
        newVel = tangentOnly;
      }
    }
  }

  p.pos = vec4f(newPos, p.pos.w - dt);
  p.vel = vec4f(newVel, 0.0);

  // Очень дальняя отсечка, чтобы система не мусорилась
  if (
    abs(p.pos.x) > uniforms.halfWidth * 4.0 ||
    p.pos.y < -40.0 ||
    abs(p.pos.z) > uniforms.halfDepth * 4.0 ||
    p.pos.w <= 0.0
  ) {
    p.pos = vec4f(0.0);
    p.vel = vec4f(0.0);
  }

  particles[idx] = p;
}