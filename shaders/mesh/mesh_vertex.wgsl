struct Uniforms {
    viewProjectionMatrix : mat4x4f,
    deformationType : f32,
    colorMode : f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) Color : vec4f,
};

@vertex
fn mesh_vertex(
    @location(0) position : vec3f
) -> VertexOutput {
    var output : VertexOutput;
    var pos = position;
    
    let x = position.x;
    let y = position.y;
    var z_offset : f32 = 0.0;
    
    // === ВАШИ РЕЖИМЫ ФОРМЫ (без изменений) ===
    if (uniforms.deformationType == 1) {
        z_offset = x;
    }
    else if (uniforms.deformationType == 2) {
        z_offset = x * x;
    }
    else if (uniforms.deformationType == 3) {
        z_offset = x * x * x;
    }
    else if (uniforms.deformationType == 4) {
        z_offset = abs(x);
    }
    else if (uniforms.deformationType == 5) {
        z_offset = sqrt(x);
    }
    else if (uniforms.deformationType == 6) {
        z_offset = 1/x;
    }
    else if (uniforms.deformationType == 7) {
        z_offset = sin(x);
    }
    
    pos.z += z_offset;
    
    // === ЦВЕТ: серый ИЛИ по натяжению ===
    var color : vec3f = vec3f(0.75, 0.75, 0.75);

if (uniforms.colorMode > 0.5) {
    let tension = computeTension(x, uniforms.deformationType);
    let t = clamp(tension / 2.0, 0.0, 1.0);

    if (t < 0.25) {
        // синий → голубой
        color = mix(
            vec3f(0.0, 0.0, 1.0),
            vec3f(0.0, 0.85, 1.0),
            t / 0.25
        );
    } 
    else if (t < 0.5) {
        // голубой → жёлтый
        color = mix(
            vec3f(0.0, 0.85, 1.0),
            vec3f(1.0, 1.0, 0.0),
            (t - 0.25) / 0.25
        );
    } 
    else if (t < 0.75) {
        // жёлтый → оранжевый
        color = mix(
            vec3f(1.0, 1.0, 0.0),
            vec3f(1.0, 0.5, 0.0),
            (t - 0.5) / 0.25
        );
    } 
    else {
        // оранжевый → красный
        color = mix(
            vec3f(1.0, 0.5, 0.0),
            vec3f(1.0, 0.0, 0.0),
            (t - 0.75) / 0.25
        );
    }
}
    
    output.Position = uniforms.viewProjectionMatrix * vec4f(pos, 1.0);
    output.Color = vec4f(color, 1.0);
    
    return output;
}

// === Аналитические производные для каждого режима ===
fn computeTension(x : f32, mode : f32) -> f32 {
    if (mode == 1) { return abs(1.0); }                           // d/dx(x) = 1
    else if (mode == 2) { return abs(2.0 * x); }                  // d/dx(x²) = 2x
    else if (mode == 3) { return abs(3.0 * x * x); }              // d/dx(x³) = 3x²
    else if (mode == 4) { return 1.0; }                           // d/dx(|x|) = ±1 → модуль = 1
    else if (mode == 5) { return abs(0.5 / sqrt(max(x, 0.001))); } // d/dx(√x) = 1/(2√x)
    else if (mode == 6) { 
        let denom = abs(x) + 0.1;
        return abs(1.0 / (denom * denom));                        // d/dx(1/(|x|+0.1))
    }
    else if (mode == 7) { return abs(cos(x)); }                   // d/dx(sin(x)) = cos(x)
    return 0.0;
}