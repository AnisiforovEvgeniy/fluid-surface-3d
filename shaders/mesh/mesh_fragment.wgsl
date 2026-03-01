@fragment
fn mesh_fragment(
    @location(0) color: vec4f,
    @location(1) worldPos: vec3f
) -> @location(0) vec4f {
    return color;
}