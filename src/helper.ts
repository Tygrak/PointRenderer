import { vec2, vec3, mat4 } from 'gl-matrix';

export function CreateTransforms(modelMat:mat4, translation:vec3 = [0,0,0], rotation:vec3 = [0,0,0], scaling:vec3 = [1,1,1]) {
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
    mat4.multiply(modelMat, rotateXMat, scaleMat);
    mat4.multiply(modelMat, rotateYMat, modelMat);        
    mat4.multiply(modelMat, rotateZMat, modelMat);
    mat4.multiply(modelMat, translateMat, modelMat);
};

export function CreateViewProjection(aspectRatio = 1.0, cameraPosition:vec3 = [2, 2, 4], center:vec3 = [0, 0, 0], upDirection:vec3 = [0, 1, 0]) {
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();       
    const viewProjectionMatrix = mat4.create();
    const far = 10000.0;
    mat4.perspective(projectionMatrix, 2*Math.PI/5, aspectRatio, 0.1, far);

    mat4.lookAt(viewMatrix, cameraPosition, center, upDirection);
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    const cameraOption = {
        eye: cameraPosition,
        center: center,
        zoomMax: 750,
        zoomSpeed: 2
    };

    return {
        viewMatrix,
        projectionMatrix,
        viewProjectionMatrix,
        cameraOption,
        far
    }
};


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
    usageFlag:GPUBufferUsageFlags = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) => {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usageFlag,
        mappedAtCreation: true
    });
    new Float32Array(buffer.getMappedRange()).set(data);
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
        }) as GPUDevice;
        timestampsEnabled = true;
        console.log("Created device with timestamps enabled");
    } catch {
        device = await adapter?.requestDevice() as GPUDevice;
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

export function CreateTimestampBuffer(device: GPUDevice, capacity: number = 8) {
    capacity = Math.floor(8); //Max number of timestamps we can store
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
    return {queryBuffer, querySet, capacity}; 
}

export function CheckWebGPU() {
    if (!navigator.gpu) {
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