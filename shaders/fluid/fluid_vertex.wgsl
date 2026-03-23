struct FluidParticle_Vert {
  pos: vec4f,
  vel: vec4f,
}

struct FluidRenderUniforms_Vert {
  viewProjection: mat4x4f,
  particleSize: f32,
  baseColor: vec4f,
}

struct VertOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) lifetime: f32,
}

@group(0) @binding(0) var<storage, read> particles: array<FluidParticle_Vert>;
@group(0) @binding(1) var<uniform> uniforms: FluidRenderUniforms_Vert;

@vertex
fn vs_main(@builtin(vertex_index) vIdx: u32) -> VertOutput {
  var output: VertOutput;
  
  let p = particles[vIdx];
  
  if (p.pos.w <= 0.0) {
    output.position = vec4f(9999.0, 9999.0, 9999.0, 1.0);
    output.color = vec4f(0.0);
    output.lifetime = 0.0;
    return output;
  }
  
  output.position = uniforms.viewProjection * vec4f(p.pos.xyz, 1.0);
  
  let alpha = smoothstep(0.0, 0.3, p.pos.w) * p.pos.w;
  output.color = vec4f(uniforms.baseColor.rgb, alpha * 0.8);
  output.lifetime = p.pos.w;
  
  return output;
}