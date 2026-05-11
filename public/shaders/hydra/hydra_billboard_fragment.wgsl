struct FragmentInput {
  @location(0) localUv: vec2f,
  @location(1) color: vec4f,
  @location(2) speed: f32,
  @location(3) lifetime: f32,

  @location(4) foamIntensity: f32,
  @location(5) foamThreshold: f32,
  @location(6) highlightIntensity: f32,
};

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4f {
  let dist = length(input.localUv);

  if (dist > 1.0) {
    discard;
  }

  let softEdge = 1.0 - smoothstep(0.35, 1.0, dist);

  let density = 1.0 - smoothstep(0.0, 0.95, dist);

  let lifeFade = clamp(input.lifetime / 2.0, 0.0, 1.0);

  let speedFoam = smoothstep(
    input.foamThreshold,
    input.foamThreshold + 7.0,
    input.speed
  );

  let foamMask =
    speedFoam *
    density *
    input.foamIntensity;

  let speedGlow =
    clamp(input.speed * 0.015, 0.0, 1.0);

  let highlightMask =
    speedGlow *
    density *
    input.highlightIntensity;

  let waterColor =
    input.color.rgb +
    vec3f(0.02, 0.10, 0.16) * density;

  let foamColor = vec3f(0.92, 0.98, 1.0);

  let highlightColor =
    vec3f(0.35, 0.65, 0.75);

  let colorWithFoam =
    mix(
      waterColor,
      foamColor,
      clamp(foamMask, 0.0, 1.0)
    );

  let finalColor =
    colorWithFoam +
    highlightColor * highlightMask;

  let alphaBoost = foamMask * 0.35;

  let alpha =
    (input.color.a + alphaBoost) *
    softEdge *
    lifeFade;

  return vec4f(finalColor, alpha);
}