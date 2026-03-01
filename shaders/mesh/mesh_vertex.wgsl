struct VertexInput {
    @location(0) position: vec3f,
    @location(1) instancePos: vec3f,
};

struct VertexOutput {
    @builtin(position) Position: vec4f,
    @location(0) Color: vec4f,
    @location(1) WorldPos: vec3f,
};

@vertex
fn mesh_vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    let worldPos = input.position + input.instancePos;
    output.WorldPos = worldPos;
    output.Position = vec4f(worldPos, 1.0);
    output.Color = vec4f(0.75, 0.75, 0.75, 1.0);
    
    return output;
}