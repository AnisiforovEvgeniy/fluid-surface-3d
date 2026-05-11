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
  let uv = input.localUv;

  let roundDist = length(uv);

  if (roundDist > 1.0) {
    discard;
  }

  // Мягкая эллиптическая форма: плотнее в центре, прозрачнее по краям.
  let edgeFade = 1.0 - smoothstep(0.55, 1.0, roundDist);

  // Более плотная сердцевина струи.
  let core = 1.0 - smoothstep(0.0, 0.75, roundDist);

  // Вертикальный/продольный след внутри вытянутой частицы.
  let streak = 1.0 - smoothstep(0.0, 0.9, abs(uv.x));

  let lifeFade = clamp(input.lifetime / 2.0, 0.0, 1.0);

  let speed01 = clamp(input.speed / 18.0, 0.0, 1.0);

  let speedFoam = smoothstep(
    input.foamThreshold,
    input.foamThreshold + 7.0,
    input.speed
  );

  let foamMask =
    speedFoam *
    core *
    input.foamIntensity;

  let waterBase =
    input.color.rgb +
    vec3f(0.02, 0.09, 0.14) * core;

  let deepWater =
    vec3f(0.05, 0.42, 0.58);

  // Быстрые участки чуть уходят в более насыщенный голубой.
  let waterColor =
    mix(
      waterBase,
      deepWater,
      speed01 * 0.25
    );

  let foamColor = vec3f(0.92, 0.98, 1.0);

  let highlight =
    vec3f(0.40, 0.75, 0.85) *
    core *
    speed01 *
    input.highlightIntensity;

  let finalColor =
    mix(
      waterColor,
      foamColor,
      clamp(foamMask, 0.0, 1.0)
    ) + highlight;

  // Центр плотный, край мягкий, быстрые участки чуть плотнее.
  let alpha =
    input.color.a *
    edgeFade *
    lifeFade *
    (0.55 + core * 0.65 + speed01 * 0.35);

  let foamAlpha =
    foamMask * 0.45 * edgeFade * lifeFade;

  return vec4f(
    finalColor,
    clamp(alpha + foamAlpha, 0.0, 1.0)
  );
}