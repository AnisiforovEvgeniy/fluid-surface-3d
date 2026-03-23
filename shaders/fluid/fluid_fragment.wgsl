struct FragInput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) lifetime: f32,
}

@fragment
fn fs_main(input: FragInput) -> @location(0) vec4f {
  if (input.lifetime <= 0.0) { discard; }
  return input.color;
}