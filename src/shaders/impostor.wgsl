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
    time : f32,
    pad2 : f32,
    pad3 : f32,
    pad4 : f32,
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

fn rand(co: vec2<f32>) -> f32 {
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

@vertex
fn vs_main(@builtin(vertex_index) index: u32, @builtin(instance_index) instance: u32, 
           @location(0) pos: vec4<f32>, @location(1) color: vec4<f32>, @location(2) normal: vec3<f32>, @location(3) size: f32) -> VertexOutput {
    let cameraRight = vec4(1, 0, 0, 0)*vMatrix;
    let cameraUp = vec4(0, 1, 0, 0)*vMatrix;
    var output: VertexOutput;
    output.position = pos;
    output.middlePos = pos;
    let temp = normal.x;
    let scale = drawSettings.atomScale*size+temp*0;
    let modelMatrixScale = vec4(length(vec3(mvpMatrix[0][0], mvpMatrix[1][0], mvpMatrix[2][0])), 
                                length(vec3(mvpMatrix[0][1], mvpMatrix[1][1], mvpMatrix[2][1])), 
                                length(vec3(mvpMatrix[0][2], mvpMatrix[1][2], mvpMatrix[2][2])), 1);
    var offsetRight = cameraRight;
    var offsetUp = cameraUp;
    if (drawSettings.billboardMode != 1) {
        offsetRight = normalize(vec4(cross(normal, vec3(-normal.x+normal.z*0.1, -normal.y+normal.x*0.1, normal.z+normal.y*0.1)), 0));
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
    
    /*
    let group = f32(instance)*1.1;
    let dir1 = normalize(vec3(rand(vec2(group*1.0771, group*1.73)), rand(vec2(group*2.0771, group*3.73)), rand(vec2(group*3.0771, group*4.73))))*vec3(1, 7, 1);
    let dir2 = normalize(vec3(rand(vec2(group*6.0771, group*6.73)), rand(vec2(group*7.0771, group*0.73)), rand(vec2(group*5.0771, group*7.73))))*vec3(1, 5.5, 1);
    let cycleMult = pow(min((drawSettings.time%12), 1), 2)*(1-pow(max((drawSettings.time%12)-11, 0), 2));
    let magnitude = cycleMult*max(mix(sqrt((11.6-drawSettings.time%12)/11.6), pow((10.5-drawSettings.time%12)/101.5, 3), 0.5), 0)*min(9*(drawSettings.time%12), 1);
    let circularSpeed = rand(vec2(group*0.91771, group*0.993273))*7+0.1;
    let circularDist = rand(vec2(group*1.91771, group*2.193273))*14+4;
    let circular = vec3(sin(drawSettings.time*circularSpeed)*circularDist, 0, cos(drawSettings.time*circularSpeed)*circularDist);
    output.position = output.position + vec4(15*cos(drawSettings.time*0.1317)*dir1*sin(drawSettings.time*0.217)+dir2*11*cos(drawSettings.time*0.1317)*cos(drawSettings.time*0.091417)+circular, 0)*magnitude;
    */
    //output.color = vec4(rand(vec2(group*1.0771, group*1.73)), rand(vec2(group*2.0771, group*3.73)), rand(vec2(group*3.0771, group*4.73)), 1.0);
    
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
    var lambertian = saturate((ndotl+1)/2);
    if (drawSettings.drawMode == 2) {
        lambertian = saturate(ndotl);
    }
    return vec4(ambientColor + color.rgb * lambertian * lightColor + color.rgb * specular * lightColor, 1.0);
}

struct FragmentOutput {
    @builtin(frag_depth) depth: f32,
    @location(0) color: vec4<f32>
}

@fragment
fn fs_main(@builtin(position) position : vec4<f32>, @location(0) color: vec4<f32>, @location(1) uv: vec2<f32>, 
           @location(2) worldPos: vec4<f32>, @location(3) normal: vec3<f32>, @location(4) middlePos: vec4<f32>) -> FragmentOutput {
    var output: FragmentOutput;
    let amount = drawSettings.amount;
    if (amount < 0) {
        output.color.b = output.color.b*1.1; 
    }
    let dist = pow(uv.x*2-1.0, 2)+pow(uv.y*2-1.0, 2);
    if (drawSettings.billboardMode != 2 && dist > 1.0) {
        discard;
    }
    let n = normalize((mMatrix*vec4(normal, 0)).xyz);
    var pos = mvpMatrix * worldPos;//-vec4(0, 0, 1, 0)*vMatrix*drawSettings.atomScale;
    if (drawSettings.drawMode == 1) {
        output.color = vec4(n, 1);
    } else { //if (drawSettings.drawMode == 0/2)
        output.color = blinnPhong(pos, cameraPos-pos, color, n);
    }
    //output.color = vec4(middlePos.z/1000, middlePos.z/1000, middlePos.z/1000, 1);
    //output.color = vec4((distance(middlePos, worldPos)+distance(middlePos, cameraPos))/position.w, (distance(middlePos, worldPos)+distance(middlePos, cameraPos))/100, (distance(middlePos, worldPos)+distance(middlePos, cameraPos))/10, 1);
    //output.color = vec4(position.w/2, position.w, position.w*10, 1);
    output.depth = position.z;
    if (drawSettings.billboardMode != 3) {
        output.depth = position.z+(distance(middlePos, worldPos)*0.02)*position.w;
    }
    return output;
}