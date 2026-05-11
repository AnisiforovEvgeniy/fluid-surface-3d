struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f( 3.0, -1.0),
    vec2f(-1.0,  3.0)
  );

  let pos = positions[vertexIndex];

  let uv = pos * 0.5 + vec2f(0.5);

  var out: VertexOutput;
  out.position = vec4f(pos, 0.0, 1.0);

  // WebGPU texture sampling имеет другой Y относительно экранного fullscreen pass.
  // Поэтому переворачиваем UV по Y.
  out.uv = vec2f(uv.x, 1.0 - uv.y);

  return out;
}