struct FragmentInput {
  @location(0) localUv: vec2f,
  @location(1) color: vec4f,
  @location(2) lifetime: f32,
};

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4f {
  let dist = length(input.localUv);

  if (dist > 1.0) {
    discard;
  }

  let softEdge = 1.0 - smoothstep(0.45, 1.0, dist);
  let centerBoost = 1.0 - smoothstep(0.0, 0.9, dist);

  let alpha = input.color.a * softEdge;
  let color = input.color.rgb + vec3f(0.08, 0.16, 0.18) * centerBoost;

  return vec4f(color, alpha);
}