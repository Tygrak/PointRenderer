@binding(0) @group(0) var<uniform> mvpMatrix : mat4x4<f32>;
@binding(1) @group(0) var<uniform> vMatrix : mat4x4<f32>;
@binding(2) @group(0) var<uniform> mMatrix : mat4x4<f32>;
@binding(3) @group(0) var<uniform> cameraPos : vec4<f32>;

struct DrawSettings {
    amount : f32,
    drawMode : f32,
    billboardMode : f32,
    atomScale : f32,
    lightDir : vec4<f32>,
}
@binding(0) @group(1) var<uniform> drawSettings : DrawSettings;

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) color : vec4<f32>,
    @location(1) uv : vec2<f32>,
    @location(2) worldPos : vec4<f32>,
    @location(3) normal : vec3<f32>,
    @location(4) middlePos : vec4<f32>
};

@vertex
fn vs_main(@builtin(vertex_index) index: u32, @location(0) pos: vec4<f32>, @location(1) color: vec4<f32>, @location(2) normal: vec3<f32>, @location(3) size: f32) -> VertexOutput {
    let mvp = mvpMatrix;
    let v = vMatrix;
    let cPos = cameraPos;
    let cameraRight = vec4(1, 0, 0, 0)*vMatrix;
    let cameraUp = vec4(0, 1, 0, 0)*vMatrix;
    var output: VertexOutput;
    output.position = pos;
    output.middlePos = pos;
    let temp = normal.x;
    let scale = drawSettings.atomScale*size+temp*0;
    var offsetRight = cameraRight;
    var offsetUp = cameraUp;
    if (drawSettings.billboardMode == 0) {
        offsetRight = normalize(vec4(cross(normal, vec3(-normal.x, -normal.y, normal.z+1)), 0));
        offsetUp = normalize(vec4(cross(normal, offsetRight.xyz), 0));
    }
    if (index%6 == 0) {
        output.position = pos + offsetRight*(-0.5)*scale + offsetUp*(-0.5)*scale;
        output.uv = vec2(0, 0);
    } else if (index%6 == 1 || index%6 == 3) {
        output.position = pos + offsetRight*(0.5)*scale + offsetUp*(-0.5)*scale;
        output.uv = vec2(1, 0);
    } else if (index%6 == 2 || index%6 == 4) {
        output.position = pos + offsetRight*(-0.5)*scale + offsetUp*(0.5)*scale;
        output.uv = vec2(0, 1);
    } else if (index%6 == 5) {
        output.position = pos + offsetRight*(0.5)*scale + offsetUp*(0.5)*scale;
        output.uv = vec2(1, 1);
    }
    output.worldPos = output.position;
    output.position = mvpMatrix * output.position;
    output.middlePos = output.middlePos;
    output.color = color;
    output.normal = normal;
    return output;
}

const lightColor = vec3(1, 1, 1);
const ambientColor = vec3(0.01, 0.01, 0.01);
const shininess = 64.0;

fn blinnPhong(position : vec4<f32>, viewDir : vec4<f32>, color: vec4<f32>, normal: vec3<f32>) -> vec4<f32> {
    let lightDir = normalize(drawSettings.lightDir);

    let ndotl = dot(lightDir.xyz, normal);
    var specular = 0.0;

    if (ndotl > 0.0) {
        let halfDir = normalize(lightDir + normalize(viewDir));
        let specAngle = max(saturate(dot(halfDir.xyz, normal)), 0.0);
        specular = pow(specAngle, shininess);
    }
    //half lambert
    let lambertian = saturate((ndotl+1)/2);
    return vec4(ambientColor + color.rgb * lambertian * lightColor + color.rgb * specular * lightColor, 1.0);
}

struct FragmentOutput {
    @builtin(frag_depth) depth: f32,
    @location(0) color: vec4<f32>
}

@fragment
fn fs_main(@builtin(position) position : vec4<f32>, @location(0) color: vec4<f32>, @location(1) uv: vec2<f32>, @location(2) worldPos: vec4<f32>, @location(3) normal: vec3<f32>, @location(4) middlePos: vec4<f32>) -> FragmentOutput {
    var output: FragmentOutput;
    let amount = drawSettings.amount;
    if (amount < 0) {
        output.color.b = output.color.b*1.1; 
    }
    let dist = pow(uv.x*2-1.0, 2)+pow(uv.y*2-1.0, 2);
    if (dist > 1.0) {
        discard;
    }
    var pos = mvpMatrix * worldPos;//-vec4(0, 0, 1, 0)*vMatrix*drawSettings.atomScale;
    if (drawSettings.drawMode == 1) {
        output.color = vec4(normal, 1);
    } else {
        output.color = blinnPhong(pos, cameraPos-pos, color, (mMatrix*vec4(normal, 0)).xyz);
    }
    //output.color = vec4(middlePos.z/1000, middlePos.z/1000, middlePos.z/1000, 1);
    //output.color = vec4((distance(middlePos, worldPos)+distance(middlePos, cameraPos))/position.w, (distance(middlePos, worldPos)+distance(middlePos, cameraPos))/100, (distance(middlePos, worldPos)+distance(middlePos, cameraPos))/10, 1);
    //output.color = vec4(position.w/2, position.w, position.w*10, 1);
    //output.depth = position.z;
    output.depth = position.z+(distance(middlePos, worldPos)*0.02)*position.w;
    return output;
}