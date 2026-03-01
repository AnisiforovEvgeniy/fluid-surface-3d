struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) Color : vec4f
};

@vertex
fn mesh_vertex(
    @location(0) position : vec3f
) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4f(position, 1.0);
    output.Color = vec4f(0.75, 0.75, 0.75, 1.0); 
    return output;
}