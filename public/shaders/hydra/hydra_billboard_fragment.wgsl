struct FragmentInput {
  @location(0) localUv: vec2f,
  @location(1) color: vec4f,
  @location(2) speed: f32,
  @location(3) lifetime: f32,
};

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4f {
  let dist = length(input.localUv);

  if (dist > 1.0) {
    discard;
  }

  // Мягкая круглая форма без резкого края.
  let softEdge = 1.0 - smoothstep(0.35, 1.0, dist);

  // Центр плотнее, края прозрачнее.
  let density = 1.0 - smoothstep(0.0, 0.95, dist);

  // Быстрые частицы выглядят чуть ярче — поток становится живее.
  let speedGlow = clamp(input.speed * 0.015, 0.0, 0.35);

  // Частица плавно затухает ближе к смерти.
  let lifeFade = clamp(input.lifetime / 2.0, 0.0, 1.0);

  let waterTint = input.color.rgb + vec3f(0.04, 0.12, 0.16) * density;
  let highlight = vec3f(0.12, 0.2, 0.22) * speedGlow * density;

  let alpha = input.color.a * softEdge * lifeFade;

  return vec4f(waterTint + highlight, alpha);
}