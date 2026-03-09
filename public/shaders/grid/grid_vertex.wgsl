struct Uniforms {
    viewProjectionMatrix : mat4x4f,
    deformationType : f32,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
    @builtin(position) Position : vec4f,
};

@vertex
fn grid_vertex(
    @location(0) position : vec3f,
    @location(1) uv : vec2f
) -> VertexOutput {
    var output : VertexOutput;
    var pos = position;
    
    let x = position.x;
    let y = position.y;
    var z_offset : f32 = 0.0;
    
    // Режим 1: z = x
    if (uniforms.deformationType == 1) {
        z_offset = x;
    }
    // Режим 2: z = x^2
    else if (uniforms.deformationType == 2) {
        z_offset = x * x;
    }
    // Режим 3: z = x^3
    else if (uniforms.deformationType == 3) {
        z_offset = x * x * x;
    }
    // Режим 4: z = |x| (галочка)
    else if (uniforms.deformationType == 4) {
        z_offset = abs(x);
    }
    // Режим 5: z = sqrt(x)
    else if (uniforms.deformationType == 5) {
        z_offset = sqrt(x);
    }
    // Режим 6: z = 1/x
    else if (uniforms.deformationType == 6) {
        z_offset = 1/x;
    }
    // Режим 7: z = sin(x)
    else if (uniforms.deformationType == 7) {
        z_offset = sin(x);
    }
    
    pos.z += z_offset;
    
    output.Position = uniforms.viewProjectionMatrix * vec4f(pos, 1.0);
    
    return output;
}