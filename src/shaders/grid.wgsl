struct Uniforms {
    mvpMatrix : mat4x4<f32>,
};
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct Output {
    @builtin(position) position : vec4<f32>,
    @location(0) vColor : vec4<f32>,
};

@vertex
fn vs_main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Output {
    let x = uniforms.mvpMatrix * pos;
    var output: Output;
    output.position = uniforms.mvpMatrix * pos;
    //output.position = pos;
    output.vColor = color;
    return output;
}

@fragment
fn fs_main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
    return vColor;
}