import { InitGPU, CreateGPUBuffer, CreateTransforms, CreateViewProjection, CreateTimestampBuffer, LoadData, LoadDataArrayBuffer} from './helper';
import shader from './shaders/basic.wgsl';
import "./site.css";
import { vec3, mat4 } from 'gl-matrix';
import $, { data } from 'jquery';
import { ImpostorRenderer } from './impostorRenderer';
import { AxisMesh } from './axisMesh';
import { LoadDataObj, LoadDataPly } from './loadData';
import { Point } from './point';

const createCamera = require('3d-view-controls');

const dataLoadButton = document.getElementById("dataLoadButton") as HTMLButtonElement;
const dataFileInput = document.getElementById("dataFileInput") as HTMLInputElement;

const sliderImpostorSizeScaleSlider = document.getElementById("impostorSizeScaleSlider") as HTMLInputElement;
const modelRotateXSlider = document.getElementById("modelRotateXSlider") as HTMLInputElement;
const modelRotateYSlider = document.getElementById("modelRotateYSlider") as HTMLInputElement;
const modelRotateZSlider = document.getElementById("modelRotateZSlider") as HTMLInputElement;
const drawAxesCheckbox = document.getElementById("drawAxesCheckbox") as HTMLInputElement;
const normalizeSizeCheckbox = document.getElementById("normalizeSizeCheckbox") as HTMLInputElement;
const rotateLightCheckbox = document.getElementById("rotateLightCheckbox") as HTMLInputElement;

const fpsCounterElement = document.getElementById("fpsCounter") as HTMLParagraphElement;
const overlayMessageElement = document.getElementById("overlayMessage") as HTMLParagraphElement;

let axisMesh: AxisMesh;
let dataImpostorRenderer: ImpostorRenderer;

let device: GPUDevice;

async function Initialize() {
    const gpu = await InitGPU(false);
    device = gpu.device;

    let timestampBuffers: {
        queryBuffer: GPUBuffer;
        querySet: GPUQuerySet;
        capacity: number;
    };
    if (gpu.timestampsEnabled) {
        timestampBuffers = CreateTimestampBuffer(device, 8);
    }

    axisMesh = new AxisMesh(device, gpu.format);
    
    let percentageShown = 1;
 
    const basicPipeline = device.createRenderPipeline({
        layout:'auto',
        vertex: {
            module: device.createShaderModule({                    
                code: shader
            }),
            entryPoint: "vs_main",
            buffers:[
                {
                    arrayStride: 4*3,
                    attributes: [{
                        shaderLocation: 0,
                        format: "float32x3",
                        offset: 0
                    }]
                },
                {
                    arrayStride: 4*3,
                    attributes: [{
                        shaderLocation: 1,
                        format: "float32x3",
                        offset: 0
                    }]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({                    
                code: shader
            }),
            entryPoint: "fs_main",
            targets: [
                {
                    format: gpu.format as GPUTextureFormat
                }
            ]
        },
        primitive:{
            topology: "triangle-list",
        },
        depthStencil:{
            format: "depth32float",
            depthWriteEnabled: true,
            depthCompare: "less"
        }
    });

    // create uniform data
    const modelMatrix = mat4.create();
    const mvpMatrix = mat4.create();
    let vMatrix = mat4.create();
    let vpMatrix = mat4.create();
    let cameraPosition = vec3.fromValues(0, 5, 45);

    let vp = CreateViewProjection(gpu.canvas.width/gpu.canvas.height, cameraPosition);
    vpMatrix = vp.viewProjectionMatrix;

    // add rotation and camera:
    let rotation = vec3.fromValues(0, 0, 0);       
    var camera = createCamera(gpu.canvas, vp.cameraOption);
    console.log(camera);

    // create uniform buffer and layout
    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const basicUniformBindGroup = device.createBindGroup({
        layout: basicPipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: 64
            }
        }]
    });

    dataLoadButton.onclick = (e) => {
        if (dataFileInput.files == null || dataFileInput.files?.length == 0) {
            console.log("No file selected!");
            return;
        }
        
        let t0 = performance.now();
        console.log(dataFileInput.files![0].name);
        if (dataFileInput.files![0].name.includes(".obj")) {
            LoadData(dataFileInput.files[0], (text: string) => {
                let points = LoadDataObj(text, 1, normalizeSizeCheckbox.checked);
                dataImpostorRenderer = new ImpostorRenderer(device, gpu.format);
                dataImpostorRenderer.LoadPoints(device, points);
                let t1 = performance.now();
                console.log("Loading data from file (" + dataFileInput.files![0].name + "): " + (t1-t0) + "ms");
                console.log("(" + points.length + " points)");
            });
        } else if (dataFileInput.files![0].name.includes(".ply")) {
            LoadDataArrayBuffer(dataFileInput.files[0], (buffer: ArrayBuffer) => {
                let points = LoadDataPly(buffer);
                dataImpostorRenderer = new ImpostorRenderer(device, gpu.format);
                dataImpostorRenderer.LoadPoints(device, points);
                let t1 = performance.now();
                console.log("Loading data from file (" + dataFileInput.files![0].name + "): " + (t1-t0) + "ms");
                console.log("(" + points.length + " points)");
            });
        }
    };

    let textureView = gpu.context.getCurrentTexture().createView();
    let depthTexture = device.createTexture({
        label: "DepthTexture",
        size: [gpu.canvas.width, gpu.canvas.height, 1],
        format: "depth32float",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
    });
    let depthTextureView = depthTexture.createView({label: "DepthTextureView"});
    let renderPassDescription = {
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 }, //background color
            loadValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 }, 
            loadOp: 'clear',
            storeOp: 'store'
        }],
        depthStencilAttachment: {
            view: depthTextureView,
            depthClearValue: 1.0,
            depthLoadOp:'clear',
            depthStoreOp: 'store',
        }
    };
    let textureQuadPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [{
            view: textureView,
            clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store'
        }],
    };
    
    Reinitialize();

    function CreateAnimation(draw : any) {
        function step() {
            rotation = [0, 0, 0];
            draw();
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    let previousFrameDeltaTimesMs: number[] = new Array<number>(60).fill(15);
    let frameId = 0;

    let startTime = 0;
    startTime = performance.now();

    function draw() {
        if (!document.hasFocus()) {
            return;
        }

        const pMatrix = vp.projectionMatrix;
        if (camera.tick()) {
            vMatrix = camera.matrix;
            mat4.multiply(vpMatrix, pMatrix, vMatrix);
        }
        frameId++;

        let cameraPosition = camera.eye;

        rotation = vec3.fromValues(parseFloat(modelRotateXSlider.value), parseFloat(modelRotateYSlider.value), parseFloat(modelRotateZSlider.value));
        CreateTransforms(modelMatrix, [0,0,0], rotation);
        mat4.multiply(mvpMatrix, vpMatrix, modelMatrix);
        device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as ArrayBuffer);

        textureView = gpu.context.getCurrentTexture().createView();
        renderPassDescription.colorAttachments[0].view = textureView;
        const commandEncoder = device.createCommandEncoder();
        if (gpu.timestampsEnabled) {
            commandEncoder.writeTimestamp(timestampBuffers.querySet, 0);
        }

        const renderPass = commandEncoder.beginRenderPass(renderPassDescription as GPURenderPassDescriptor);

        if (dataImpostorRenderer != undefined) {
            let vpImpostor = CreateViewProjection(gpu.canvas.width/gpu.canvas.height, cameraPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
            let vImpostorMatrix = mat4.clone(vpImpostor.viewMatrix);
            let drawAmount = 1;
            let sizeScale = parseFloat(sliderImpostorSizeScaleSlider.value);
            if (rotateLightCheckbox.checked) {
                dataImpostorRenderer.lightDir = [Math.sin((performance.now()-startTime)/1000.0), 1, Math.cos((performance.now()-startTime)/1000.0)];
            }
            dataImpostorRenderer.Draw(device, renderPass, mvpMatrix, vImpostorMatrix, cameraPosition, drawAmount, sizeScale);
        }
        
        renderPass.setPipeline(basicPipeline);
        renderPass.setBindGroup(0, basicUniformBindGroup);
        if (drawAxesCheckbox.checked) {
            axisMesh.DrawStructure(renderPass, vpMatrix);
        }

        renderPass.end();

        if (gpu.timestampsEnabled) {
            commandEncoder.writeTimestamp(timestampBuffers.querySet, 1);
            commandEncoder.resolveQuerySet(timestampBuffers.querySet, 0, 2, timestampBuffers.queryBuffer, 0);
        }
        
        device.queue.submit([commandEncoder.finish()]);
        
        //read query buffer with timestamps
        if (gpu.timestampsEnabled) {
            const size = timestampBuffers.queryBuffer.size;
            const gpuReadBuffer = device.createBuffer({size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});  const copyEncoder = device.createCommandEncoder();
            copyEncoder.copyBufferToBuffer(timestampBuffers.queryBuffer, 0, gpuReadBuffer, 0, size);  const copyCommands = copyEncoder.finish();
            device.queue.submit([copyCommands]);
            const currFrame = frameId;
            gpuReadBuffer.mapAsync(GPUMapMode.READ).finally(() => {
                let arrayBuffer = gpuReadBuffer.getMappedRange();
                const timingsNanoseconds = new BigInt64Array(arrayBuffer);
                const frameTimeMs = Number((timingsNanoseconds[1]-timingsNanoseconds[0])/BigInt(1000))/1000;
                previousFrameDeltaTimesMs[currFrame%previousFrameDeltaTimesMs.length] = frameTimeMs;
                fpsCounterElement.innerText = (previousFrameDeltaTimesMs.reduce((acc, c) => acc+c)/previousFrameDeltaTimesMs.length).toFixed(3) + "ms";
            });
        } else {
            fpsCounterElement.innerText = "timestamps not enabled";
        }
    }
    
    function Reinitialize() {
        vp = CreateViewProjection(gpu.canvas.width/gpu.canvas.height, cameraPosition);
        vpMatrix = vp.viewProjectionMatrix;
        textureView = gpu.context.getCurrentTexture().createView({label: "MainTextureView"});
        depthTexture = device.createTexture({
            label: "DepthTexture",
            size: [gpu.canvas.width, gpu.canvas.height, 1],
            format: "depth32float",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });
        depthTextureView = depthTexture.createView({label: "DepthTextureView"});
        renderPassDescription = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 }, //background color
                loadValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 }, 
                loadOp: 'clear',
                storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: depthTextureView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        };
        textureQuadPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.2, g: 0.247, b: 0.314, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }],
        };
    }

    window.addEventListener('resize', function(){
        Reinitialize();
    });
    
    if (document != null) {
        document.addEventListener('keypress', function(keyEvent: KeyboardEvent){
            if (keyEvent.code == "Numpad1") {
                let distance = vec3.distance(camera.eye, camera.center);
                camera.eye = [0, 0, 0];
                camera.up = [0, 1, 0];
                camera.center = [0, 0, -distance];
            } else if (keyEvent.code == "Numpad2") {
                let distance = vec3.distance(camera.eye, camera.center);
                camera.eye = [0, 0, 0];
                camera.up = [0, 1, 0];
                camera.center = [0, 0, distance];
            } else if (keyEvent.code == "Numpad3") {
                let distance = vec3.distance(camera.eye, camera.center);
                camera.eye = [0, 0, 0];
                camera.up = [0, 1, 0];
                camera.center = [-distance, 0, 0];
            } else if (keyEvent.code == "Numpad4") {
                let distance = vec3.distance(camera.eye, camera.center);
                camera.eye = [0, 0, 0];
                camera.up = [0, 1, 0];
                camera.center = [distance, 0, 0];
            } else if (keyEvent.code == "Numpad5") {
                let distance = vec3.distance(camera.eye, camera.center);
                camera.eye = [0, 0, 0];
                camera.up = [0, 1, 0];
                camera.center = [0, 5, 45];
            } else if (keyEvent.code == "Numpad7") {
                let distance = vec3.distance(camera.eye, camera.center);
                camera.eye = [0, 0, 0];
                camera.up = [0, 0, 1];
                camera.center = [0, distance, 0];
            } else if (keyEvent.code == "Numpad9") {
                let distance = vec3.distance(camera.eye, camera.center);
                camera.eye = [0, 0, 0];
                camera.up = [0, 0, 1];
                camera.center = [0, -distance, 0];
            } else if (keyEvent.code == "NumpadAdd") {
                let distance = vec3.distance(camera.eye, camera.center);
                let normDir = vec3.normalize(vec3.create(), camera.eye);
                if (Math.abs(camera.eye[0])+Math.abs(camera.eye[1])+Math.abs(camera.eye[2]) < 0.01) {
                    normDir = vec3.normalize(vec3.create(), camera.center);
                }
                let p = vec3.scale(vec3.create(), normDir, distance-5);
                camera.eye = [0, 0, 0];
                camera.up = camera.up;
                camera.center = [p[0], p[1], p[2]];
            } else if (keyEvent.code == "NumpadSubtract") {
                let distance = vec3.distance(camera.eye, camera.center);
                let normDir = vec3.normalize(vec3.create(), camera.eye);
                if (Math.abs(camera.eye[0])+Math.abs(camera.eye[1])+Math.abs(camera.eye[2]) < 0.01) {
                    normDir = vec3.normalize(vec3.create(), camera.center);
                }
                let p = vec3.scale(vec3.create(), normDir, distance+5);
                camera.eye = [0, 0, 0];
                camera.up = camera.up;
                camera.center = [p[0], p[1], p[2]];
            }
        });
    }

    CreateAnimation(draw);
}

Initialize();

