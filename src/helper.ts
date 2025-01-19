import { vec3, vec4, mat4 } from 'gl-matrix';
import { ImpostorRenderer } from './impostorRenderer';
import { Point } from './point';

export function CreateModelMatrix(out: mat4, translation:vec3 = [0,0,0], rotation:vec3 = [0,0,0], scaling:vec3 = [1,1,1]) {
    const rotateXMat = mat4.create();
    const rotateYMat = mat4.create();
    const rotateZMat = mat4.create();   
    const translateMat = mat4.create();
    const scaleMat = mat4.create();

    //perform individual transformations
    mat4.fromTranslation(translateMat, translation);
    mat4.fromXRotation(rotateXMat, rotation[0]);
    mat4.fromYRotation(rotateYMat, rotation[1]);
    mat4.fromZRotation(rotateZMat, rotation[2]);
    mat4.fromScaling(scaleMat, scaling);

    //combine all transformation matrices together to form a final transform matrix: modelMat
    mat4.multiply(out, rotateXMat, scaleMat);
    mat4.multiply(out, rotateYMat, out);        
    mat4.multiply(out, rotateZMat, out);
    mat4.multiply(out, translateMat, out);
    return out;
};

export function CreateViewProjection(aspectRatio = 1.0, cameraPosition:vec3 = [2, 2, 4], center:vec3 = [0, 0, 0], upDirection:vec3 = [0, 1, 0], far = 5000) {
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();       
    const viewProjectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 2*Math.PI/5, aspectRatio, 0.1, far);

    mat4.lookAt(viewMatrix, cameraPosition, center, upDirection);
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    return {
        viewMatrix,
        projectionMatrix,
        viewProjectionMatrix,
        far
    }
}; 

//https://iquilezles.org/articles/frustum/
/*
export function GetViewFrustumPlanes(matrix: mat4) {
    return [
        vec4.fromValues(matrix[12]-matrix[0], matrix[13]-matrix[1], matrix[14]-matrix[2], matrix[15]-matrix[3]),
        vec4.fromValues(matrix[12]+matrix[0], matrix[13]+matrix[1], matrix[14]+matrix[2], matrix[15]+matrix[3]),
        vec4.fromValues(matrix[12]+matrix[4], matrix[13]+matrix[5], matrix[14]+matrix[6], matrix[15]+matrix[7]),
        vec4.fromValues(matrix[12]-matrix[4], matrix[13]-matrix[5], matrix[14]-matrix[6], matrix[15]-matrix[7]),
        vec4.fromValues(matrix[12]-matrix[8], matrix[13]-matrix[9], matrix[14]-matrix[10], matrix[15]-matrix[11]),
        vec4.fromValues(matrix[12]+matrix[8], matrix[13]+matrix[9], matrix[14]+matrix[10], matrix[15]+matrix[11]),
    ];
}*/

export function GetViewFrustum(vMatrix: mat4, pMatrix: mat4) {
    let corners: vec3[] = [];
    let inv_v = mat4.invert(mat4.create(), vMatrix);
    let inv_p = mat4.invert(mat4.create(), pMatrix);
    for (let x = -1; x <= 1; x+=2) {
        for (let y = -1; y <= 1; y+=2) {
            for (let z = -1; z <= 1; z+=2) {
                let ndc_corner = vec4.fromValues(x, y, z, 1);
                let view_corner_h = vec4.transformMat4(vec4.create(), ndc_corner, inv_p);
                let view_corner = vec4.scale(vec4.create(), view_corner_h, 1/view_corner_h[3]);
                let world_corner = vec4.transformMat4(vec4.create(), view_corner, inv_v);
                corners.push(vec3.fromValues(world_corner[0], world_corner[1], world_corner[2]));
            }
        }
    }
    let triangles: number[][] = [];
    triangles.push([0, 1, 2]);
    triangles.push([3, 1, 2]);
    triangles.push([2, 3, 6]);
    triangles.push([7, 3, 6]);
    triangles.push([6, 7, 4]);
    triangles.push([5, 7, 4]);
    triangles.push([0, 4, 1]);
    triangles.push([5, 4, 1]);
    triangles.push([0, 2, 4]);
    triangles.push([6, 2, 4]);
    triangles.push([1, 5, 3]);
    triangles.push([7, 5, 3]);
    let normals: vec3[] = [];
    let planes: vec4[] = [];
    for (let i = 0; i < triangles.length; i+=2) {
        let normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), vec3.subtract(vec3.create(), corners[triangles[i][1]], corners[triangles[i][0]]), vec3.subtract(vec3.create(), corners[triangles[i][2]], corners[triangles[i][0]])));
        normals.push(normal);
        let onPlane = corners[triangles[i][0]];
        planes.push(vec4.fromValues(normal[0], normal[1], normal[2], -(onPlane[0]*normal[0]+onPlane[1]*normal[1]+onPlane[2]*normal[2])));
    }
    let normalsTest: vec3[] = [];
    for (let i = 0; i < normals.length; i++) {
        let center = vec3.scale(vec3.create(),
            vec3.add(vec3.create(), 
            vec3.add(vec3.create(), corners[triangles[i*2][0]], corners[triangles[i*2][1]]), 
            vec3.add(vec3.create(), corners[triangles[i*2][2]], corners[triangles[i*2+1][0]])), 
            1/4);
        normalsTest.push(center);
        normalsTest.push(vec3.add(vec3.create(), vec3.scale(vec3.create(), normals[i], 1), center));
        normalsTest.push(vec3.add(vec3.create(), vec3.scale(vec3.create(), normals[i], 2), center));
        normalsTest.push(vec3.add(vec3.create(), vec3.scale(vec3.create(), normals[i], 3), center));
        normalsTest.push(vec3.add(vec3.create(), vec3.scale(vec3.create(), normals[i], 4), center));
    }
    return {corners, normals, triangles, planes, normalsTest};
}

export function CreateImpostorRendererFromVectors(device: GPUDevice, format: GPUTextureFormat, vectors: vec3[], color: vec3 = vec3.fromValues(1, 1, 1), size: number = 1) {
    let renderer = new ImpostorRenderer(device, format);
    let points: Point[] = [];
    for (let i = 0; i < vectors.length; i++) {
        let point = new Point(vectors[i][0], vectors[i][1], vectors[i][2], 0, 1, 0);
        point.r = color[0]; point.g = color[1]; point.b = color[2];
        point.size = size;
        points.push(point);
    }
    renderer.LoadPoints(device, points);
    return renderer;
}

export function CreateImpostorRendererFromPoints(device: GPUDevice, format: GPUTextureFormat, points: Point[], color: vec3 = vec3.fromValues(-1, -1, -1), size: number = -1) {
    let renderer = new ImpostorRenderer(device, format);
    let pointsResult: Point[] = [];
    for (let i = 0; i < points.length; i++) {
        let point = new Point(points[i].x, points[i].y, points[i].z, points[i].normal[0], points[i].normal[1], points[i].normal[2]);
        if (color[0] != -1) {
            point.r = color[0]; point.g = color[1]; point.b = color[2];
        } else {
            point.r = points[i].r; point.g = points[i].g; point.b = points[i].b;
        }
        if (size != -1) {
            point.size = size;
        } else {
            point.size = points[i].size;
        }
        pointsResult.push(point);
    }
    renderer.LoadPoints(device, pointsResult);
    return renderer;
}


export function CreateGPUBufferUint(device:GPUDevice, data:Uint32Array, 
    usageFlag:GPUBufferUsageFlags = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST) {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Uint32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
};

export const CreateGPUBuffer = (device:GPUDevice, data:Float32Array, 
    usageFlag: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
};

export const CreateUintGPUBuffer = (device:GPUDevice, data:Uint8Array, 
    usageFlag: GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Uint8Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    return buffer;
};

export async function InitGPU(fixedCanvas: boolean) {
    CheckWebGPU();
    InitCanvas(fixedCanvas);
    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter();
    let timestampsEnabled = false;
    let device: GPUDevice;
    try {
        device = await adapter?.requestDevice({
            requiredFeatures: ["timestamp-query"],
            requiredLimits: {"maxBufferSize" : 536870912} //536870912 -- half gigabyte
        }) as GPUDevice;
        timestampsEnabled = true;
        console.log("Created device with timestamps enabled");
    } catch {
        device = await adapter?.requestDevice({requiredLimits: {"maxBufferSize" : 536870912}}) as GPUDevice;
        console.log("Created device with timestamps disabled, performance tracking won't be available.");
        console.log("Launch chrome with this command line option to enable: '--disable-dawn-features=disallow_unsafe_apis'");
    }
    const context = canvas.getContext('webgpu') as GPUCanvasContext;

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: format,
        alphaMode:'opaque'
    });
    return{ device, canvas, format, context, timestampsEnabled };
};


export function lerp(x: number, y: number, t: number){
    return (1-t)*x+t*y;
}

export function CreateTimestampBuffer(device: GPUDevice, capacity: number = 8) {
    capacity = Math.floor(capacity); //Max number of timestamps we can store
    let querySet = device.createQuerySet({
        type: "timestamp",
        count: capacity,
    });
    let queryBuffer = device.createBuffer({
        size: 8 * capacity,
        usage: GPUBufferUsage.QUERY_RESOLVE 
        | GPUBufferUsage.STORAGE
        | GPUBufferUsage.COPY_SRC
        | GPUBufferUsage.COPY_DST,
    });
    let resultBuffer = device.createBuffer({
        size: queryBuffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    return {queryBuffer, resultBuffer, querySet, capacity}; 
}

export async function CheckWebGPU() {
    let available = navigator.gpu != undefined;
    try {
        const webGpu = await navigator.gpu?.requestAdapter();
    } catch {
        available = false;
    }
    if (!available) {
        const notSupportedElement = document.getElementById("overlayNotSupportedWebGPU") as HTMLParagraphElement;
        let result = `
        <br>Your current browser does not support WebGPU! The application requires WebGPU to function.
        <br>Currently, WebGPU is supported in  
        <a href="https://www.google.com/chrome/canary/">Chrome Canary</a>
        with the flag "enable-unsafe-webgpu" enabled and in <a href="https://nightly.mozilla.org/">Firefox Nightly</a>. <br>See the 
        <a href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status"> 
        Implementation Status</a> page for more details.           
        `;
        console.log(result);
        notSupportedElement.innerHTML = result;
        notSupportedElement.style.display = "block";
        throw('Your current browser does not support WebGPU!');
    } 
    return true;
}

export function InitCanvas(useFixedSize: boolean) {
    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    if(canvas){
        const div = document.getElementsByClassName('item2')[0] as HTMLDivElement;
        if(div){
            if (useFixedSize) {
                canvas.width  = Math.min(div.offsetWidth, 640);
                canvas.height = Math.min(div.offsetHeight, 640);
                canvas.classList.add("fixedSize");
            } else {
                canvas.width  = div.offsetWidth;
                canvas.height = div.offsetHeight;
            }

            function windowResize() {
                if (canvas.classList.contains("fixedSize")) {
                } else {
                    canvas.width  = div.offsetWidth;
                    canvas.height = div.offsetHeight;
                }
            };
            window.addEventListener('resize', windowResize);
        }
    }
}

export function LoadData(dataFile: File, callback: Function) {
    let reader = new FileReader();
    reader.onload = function (textResult) {
        if (textResult.target == null) {
            return;
        }
        let text = textResult.target.result;
        callback(text);
    }
    reader.onerror = function (e) {
        throw ("Loading the data file failed.");
    }
    reader.readAsText(dataFile, "UTF-8");
}

export function LoadDataArrayBuffer(dataFile: File, callback: Function) {
    let reader = new FileReader();
    reader.onload = function (result) {
        if (result.target == null) {
            return;
        }
        let arrayBuffer = result.target.result;
        callback(arrayBuffer);
    }
    reader.onerror = function (e) {
        throw ("Loading the data file failed.");
    }
    reader.readAsArrayBuffer(dataFile);
}

