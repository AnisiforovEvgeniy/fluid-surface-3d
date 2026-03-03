struct Uniforms {
    viewProjectionMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) Color : vec4f
};

@vertex
fn mesh_vertex(
    @location(0) position : vec3f
) -> VertexOutput {
    var output : VertexOutput;
    
    output.Position = uniforms.viewProjectionMatrix * vec4f(position, 1.0);
    
    output.Color = vec4f(0.75, 0.75, 0.75, 1.0); 
    return output;
}