struct Uniforms {
    viewProjectionMatrix: mat4x4f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) Position: vec4f,
};

@vertex
fn grid_vertex(
    @location(0) position: vec3f,
    @location(1) uv: vec2f
) -> VertexOutput {
    var output: VertexOutput;
    output.Position = uniforms.viewProjectionMatrix * vec4f(position, 1.0);
    
    return output;
}