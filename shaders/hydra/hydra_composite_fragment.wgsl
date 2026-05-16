@group(0) @binding(0)
var hydraSampler: sampler;

@group(0) @binding(1)
var hydraTexture: texture_2d<f32>;

struct FragmentInput {
  @location(0) uv: vec2f,
};

fn sampleAlpha(uv: vec2f) -> f32 {
  return textureSample(hydraTexture, hydraSampler, uv).a;
}

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4f {
  let uv = input.uv;
  let texSize = vec2f(textureDimensions(hydraTexture));
  let texel = 1.0 / texSize;

  let center = textureSample(hydraTexture, hydraSampler, uv);

  let left  = textureSample(hydraTexture, hydraSampler, uv - vec2f(texel.x, 0.0));
  let right = textureSample(hydraTexture, hydraSampler, uv + vec2f(texel.x, 0.0));
  let up    = textureSample(hydraTexture, hydraSampler, uv + vec2f(0.0, texel.y));
  let down  = textureSample(hydraTexture, hydraSampler, uv - vec2f(0.0, texel.y));

  let blur = (left + right + up + down) * 0.25;
  let smoothWater = mix(center, blur, 0.5);

  let alpha = smoothWater.a;

  if (alpha <= 0.01) {
    discard;
  }

  // Псевдо-толщина воды по alpha.
  let thickness = clamp(alpha * 1.8, 0.0, 1.0);

  // Восстанавливаем screen-space normal из перепада alpha.
  let dx = sampleAlpha(uv + vec2f(texel.x, 0.0)) - sampleAlpha(uv - vec2f(texel.x, 0.0));
  let dy = sampleAlpha(uv + vec2f(0.0, texel.y)) - sampleAlpha(uv - vec2f(0.0, texel.y));

  let normalStrength = 3.5;
  let normal = normalize(vec3f(-dx * normalStrength, -dy * normalStrength, 1.0));

  // Направление света в screen-space.
  let lightDir = normalize(vec3f(-0.35, 0.55, 0.75));
  let viewDir = vec3f(0.0, 0.0, 1.0);
  let halfDir = normalize(lightDir + viewDir);

  let diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
  let specular = pow(clamp(dot(normal, halfDir), 0.0, 1.0), 64.0);

  // Fresnel: края воды светлее.
  let fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 3.0);

  let shallowColor = vec3f(0.55, 0.95, 1.0);
  let deepColor = vec3f(0.02, 0.34, 0.58);
  let baseWater = mix(shallowColor, deepColor, thickness);

  let litWater =
    baseWater * (0.55 + diffuse * 0.55) +
    vec3f(1.0, 1.0, 1.0) * specular * 0.75 +
    vec3f(0.55, 0.95, 1.0) * fresnel * 0.45;

  // Пенная кайма по средней плотности.
  let edgeFoam =
    smoothstep(0.04, 0.25, alpha) *
    (1.0 - smoothstep(0.35, 0.85, alpha));

  let foamColor = vec3f(0.9, 0.98, 1.0);
  let finalColor = mix(litWater, foamColor, edgeFoam * 0.5);

  return vec4f(finalColor, clamp(alpha * 1.18, 0.0, 1.0));
}