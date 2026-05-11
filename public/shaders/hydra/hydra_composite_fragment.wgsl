@group(0) @binding(0)
var hydraSampler: sampler;

@group(0) @binding(1)
var hydraTexture: texture_2d<f32>;

struct FragmentInput {
  @location(0) uv: vec2f,
};

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4f {
  let uv = input.uv;

  let center = textureSample(hydraTexture, hydraSampler, uv);

  // Лёгкое screen-space сглаживание слоя воды.
  let offset = 1.0 / vec2f(textureDimensions(hydraTexture));

  let blur =
    textureSample(hydraTexture, hydraSampler, uv + vec2f( offset.x, 0.0)) +
    textureSample(hydraTexture, hydraSampler, uv + vec2f(-offset.x, 0.0)) +
    textureSample(hydraTexture, hydraSampler, uv + vec2f(0.0,  offset.y)) +
    textureSample(hydraTexture, hydraSampler, uv + vec2f(0.0, -offset.y));

  let smoothWater = mix(center, blur * 0.25, 0.45);

  let alpha = smoothWater.a;

  if (alpha <= 0.01) {
    discard;
  }

  // Псевдо-толщина: чем выше alpha, тем плотнее вода.
  let thickness = clamp(alpha * 1.8, 0.0, 1.0);

  let shallowColor = vec3f(0.55, 0.95, 1.0);
  let deepColor = vec3f(0.02, 0.42, 0.62);

  let waterColor = mix(shallowColor, deepColor, thickness);

  // Белёсые края дают ощущение пены/воздуха.
  let edgeFoam = smoothstep(0.05, 0.35, alpha) * (1.0 - smoothstep(0.35, 0.9, alpha));
  let foamColor = vec3f(0.9, 0.98, 1.0);

  let finalColor = mix(waterColor, foamColor, edgeFoam * 0.45);

  return vec4f(finalColor, clamp(alpha * 1.15, 0.0, 1.0));
}