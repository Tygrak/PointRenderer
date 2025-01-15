import { InitGPU, CreateGPUBuffer, CreateModelMatrix, CreateViewProjection, CreateTimestampBuffer, LoadData, LoadDataArrayBuffer, GetViewFrustum, CreateImpostorRendererFromVectors, CreateImpostorRendererFromPoints} from './helper';
import shader from './shaders/basic.wgsl';
import { vec3, vec4, mat4 } from 'gl-matrix';
import $, { data } from 'jquery';
import { ImpostorRenderer } from './impostorRenderer';
import { AxisMesh } from './axisMesh';
import { DataLoader } from './loadData';
import { Point } from './point';

import './site.css';
import { FreeCamera } from './freeCamera';

const createCamera = require('3d-view-controls');

const dataLoadButton = document.getElementById("dataLoadButton") as HTMLButtonElement;
const dataFileInput = document.getElementById("dataFileInput") as HTMLInputElement;

const sliderImpostorSizeScaleSlider = document.getElementById("impostorSizeScaleSlider") as HTMLInputElement;
const modelRotateXSlider = document.getElementById("modelRotateXSlider") as HTMLInputElement;
const modelRotateYSlider = document.getElementById("modelRotateYSlider") as HTMLInputElement;
const modelRotateZSlider = document.getElementById("modelRotateZSlider") as HTMLInputElement;
const maxPointsSplitSlider = document.getElementById("maxPointsSplitSlider") as HTMLInputElement;
const drawAxesCheckbox = document.getElementById("drawAxesCheckbox") as HTMLInputElement;
const normalizeSizeCheckbox = document.getElementById("normalizeSizeCheckbox") as HTMLInputElement;
const rotateLightCheckbox = document.getElementById("rotateLightCheckbox") as HTMLInputElement;
const billboardSelect = document.getElementById("billboardSelect") as HTMLSelectElement;
const debugSelect = document.getElementById("debugSelect") as HTMLSelectElement;
const defaultColorRInput = document.getElementById("defaultColorRInput") as HTMLInputElement;
const defaultColorGInput = document.getElementById("defaultColorGInput") as HTMLInputElement;
const defaultColorBInput = document.getElementById("defaultColorBInput") as HTMLInputElement;

const renderMsElement = document.getElementById("renderMsCounter") as HTMLElement;
const jsMsCounterElement = document.getElementById("frameMsCounter") as HTMLElement;
const pointsCounterElement = document.getElementById("pointsCounter") as HTMLElement;
const pointsRenderedCounterElement = document.getElementById("pointsRenderedCounter") as HTMLElement;
const overlayMessageElement = document.getElementById("overlayMessage") as HTMLParagraphElement;

let axisMesh: AxisMesh;
let impostorRenderers: ImpostorRenderer[] = [];

let freeCam = new FreeCamera();

let device: GPUDevice;

async function Initialize() {
    const gpu = await InitGPU(false);
    device = gpu.device;

    let timestampBuffers: {
        queryBuffer: GPUBuffer;
        resultBuffer: GPUBuffer;
        querySet: GPUQuerySet;
        capacity: number;
    };
    if (gpu.timestampsEnabled) {
        timestampBuffers = CreateTimestampBuffer(device, 2);
    }

    axisMesh = new AxisMesh(device, gpu.format);
    
    let percentageShown = 1;
 
    // create uniform data
    const mvpMatrix = mat4.create();
    let vMatrix = mat4.create();
    let vpMatrix = mat4.create();
    let cameraPosition = vec3.fromValues(0, 5, 45);

    let vp = CreateViewProjection(gpu.canvas.width/gpu.canvas.height, cameraPosition);
    vpMatrix = vp.viewProjectionMatrix;

    // add rotation and camera:
    let rotation = vec3.fromValues(0, 0, 0);       
    var camera = createCamera(gpu.canvas, vp.cameraOption);

    let dataLoader = new DataLoader(device, gpu.format);

    dataLoadButton.onclick = (e) => {
        if (dataFileInput.files == null || dataFileInput.files?.length == 0) {
            console.log("No file selected!");
            return;
        }
        
        let t0 = performance.now();
        console.log(dataFileInput.files![0].name);
        dataLoader.MaxTrianglePoints = parseInt(maxPointsSplitSlider.value);
        dataLoader.DefaultColor = vec3.fromValues(parseFloat(defaultColorRInput.value), parseFloat(defaultColorGInput.value), parseFloat(defaultColorBInput.value));

        if (dataFileInput.files![0].name.includes(".obj")) {
            LoadData(dataFileInput.files[0], (text: string) => {
                impostorRenderers = dataLoader.LoadDataObj(text, 1, normalizeSizeCheckbox.checked);
                let t1 = performance.now();
                console.log("Loading data from file (" + dataFileInput.files![0].name + "): " + (t1-t0) + "ms");
            });
        } else if (dataFileInput.files![0].name.includes(".ply")) {
            LoadDataArrayBuffer(dataFileInput.files[0], (buffer: ArrayBuffer) => {
                impostorRenderers = dataLoader.LoadDataPly(buffer, 1, normalizeSizeCheckbox.checked);
                let t1 = performance.now();
                console.log("Loading data from file (" + dataFileInput.files![0].name + "): " + (t1-t0) + "ms");
            });
        } else if (dataFileInput.files![0].name.includes(".gltf") || dataFileInput.files![0].name.includes(".glb")) {
            let filemap: Map<string, File> = new Map<string, File>();
            for (let i = 0; i < dataFileInput.files.length; i++) {
                filemap.set(dataFileInput.files[i].name, dataFileInput.files[i]);
            }
            let loadFunc = async () => {
                impostorRenderers = await dataLoader.LoadDataGltfFile(filemap);
                let t1 = performance.now();
                console.log("Loading data from file (" + dataFileInput.files![0].name + "): " + (t1-t0) + "ms");
            };
            loadFunc();
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
        },
        ...(gpu.timestampsEnabled && {
            timestampWrites: {
                querySet: timestampBuffers.querySet,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1,
            },
        }),
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
    let previousJsDeltaTimesMs: number[] = new Array<number>(60).fill(15);
    let frameId = 0;

    let startTime = performance.now();
    let lastFrameTime = performance.now();
    let gpuTime = 0;

    function draw() {
        if (!document.hasFocus()) {
            return;
        }

        let pMatrix = vp.projectionMatrix;
        if (!freeCam.used && camera.tick()) {
            vMatrix = camera.matrix;
            mat4.multiply(vpMatrix, pMatrix, vMatrix);
        }
        frameId++;

        cameraPosition = camera.eye;

        rotation = vec3.fromValues(parseFloat(modelRotateXSlider.value), parseFloat(modelRotateYSlider.value), parseFloat(modelRotateZSlider.value));

        textureView = gpu.context.getCurrentTexture().createView();
        renderPassDescription.colorAttachments[0].view = textureView;
        const commandEncoder = device.createCommandEncoder();

        const renderPass = commandEncoder.beginRenderPass(renderPassDescription as GPURenderPassDescriptor);

        let vpImpostor = CreateViewProjection(gpu.canvas.width/gpu.canvas.height, cameraPosition, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
        if (freeCam.used) {
            vpImpostor = CreateViewProjection(gpu.canvas.width/gpu.canvas.height, freeCam.position, vec3.add(vec3.create(), freeCam.position, freeCam.forward), freeCam.up);
            vpMatrix = vpImpostor.viewProjectionMatrix;
            vMatrix = vpImpostor.viewMatrix;
            pMatrix = vpImpostor.projectionMatrix;
            cameraPosition = freeCam.position;
        }
        let frustum = GetViewFrustum(vMatrix, pMatrix);
        let frustumPlanes = frustum.planes;
        
        let rotationMatrix = CreateModelMatrix(mat4.create(), [0,0,0], rotation);
        rotationMatrix = mat4.mul(rotationMatrix, vpMatrix, rotationMatrix);
        let vImpostorMatrix = mat4.clone(vpImpostor.viewMatrix);
        let drawAmount = 1;
        let sizeScale = parseFloat(sliderImpostorSizeScaleSlider.value);
        let pointsCount = 0;
        let renderedCount = 0;
        for (let i = 0; i < impostorRenderers.length; i++) {
            let impostorRenderer = impostorRenderers[i];
            pointsCount += impostorRenderer.pointsCount;
            if (!impostorRenderer.isStatic && !impostorRenderer.aabb.ShouldRenderForFrustum(frustumPlanes, impostorRenderer.modelMatrix)) {
                continue;
            } else if (impostorRenderer.isStatic && !impostorRenderer.worldAabb.IsPartlyInFrustum(frustumPlanes)) {
                continue;
            }
            renderedCount += impostorRenderer.pointsCount;
            let modelMatrix = impostorRenderer.modelMatrix;
            mat4.multiply(mvpMatrix, rotationMatrix, modelMatrix);
            if (rotateLightCheckbox.checked) {
                impostorRenderer.lightDir = [Math.sin((performance.now()-startTime)/1000.0), 1, Math.cos((performance.now()-startTime)/1000.0)];
            }
            impostorRenderer.time = (performance.now()-startTime)/1000.0;
            impostorRenderer.billBoardMode = parseInt(billboardSelect.value);
            impostorRenderer.drawMode = parseInt(debugSelect.value);
            impostorRenderer.Draw(device, renderPass, mvpMatrix, vImpostorMatrix, modelMatrix, cameraPosition, drawAmount, sizeScale);
        }
        
        if (drawAxesCheckbox.checked) {
            axisMesh.DrawStructure(renderPass, vpMatrix);
        }

        renderPass.end();

        if (gpu.timestampsEnabled) {
            commandEncoder.resolveQuerySet(timestampBuffers.querySet, 0, timestampBuffers.querySet.count, timestampBuffers.queryBuffer, 0);
            if (timestampBuffers.resultBuffer.mapState === 'unmapped') {
                commandEncoder.copyBufferToBuffer(timestampBuffers.queryBuffer, 0, timestampBuffers.resultBuffer, 0, timestampBuffers.resultBuffer.size);
            }
        }
        
        device.queue.submit([commandEncoder.finish()]);
        
        if (performance.now()-lastFrameTime < 2000) {
            previousJsDeltaTimesMs[frameId%previousJsDeltaTimesMs.length] = performance.now()-lastFrameTime;
        }
        jsMsCounterElement.innerText = (previousJsDeltaTimesMs.reduce((acc, c) => acc+c)/previousJsDeltaTimesMs.length).toFixed(3) + "ms (js)";
        lastFrameTime = performance.now();
        pointsCounterElement.innerText = pointsCount.toFixed(0) + " points";
        pointsRenderedCounterElement.innerText = renderedCount.toFixed(0) + " rendered";
        //read query buffer with timestamps
        if (gpu.timestampsEnabled && timestampBuffers.resultBuffer.mapState === 'unmapped') {
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
                renderMsElement.innerText = (previousFrameDeltaTimesMs.reduce((acc, c) => acc+c)/previousFrameDeltaTimesMs.length).toFixed(3) + "ms";
            });
        } else {
            renderMsElement.innerText = "timestamps not enabled";
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
            },
            ...(gpu.timestampsEnabled && {
                timestampWrites: {
                    querySet: timestampBuffers.querySet,
                    beginningOfPassWriteIndex: 0,
                    endOfPassWriteIndex: 1,
                },
            }),
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
    
    let pitch = Math.PI/2;
    let yaw = 0;
    let lastMousePosX = 0;
    let lastMousePosY = 0;
    let mouseDown = false;

    if (document != null) {
        freeCam.Initialize(gpu.canvas);

        document.addEventListener('keypress', function(keyEvent: KeyboardEvent) {
            if (keyEvent.code == "KeyC") {
                if (!freeCam.used) {
                    freeCam.position = camera.eye;
                    freeCam.CalculateRotation();
                    //freeCam.forward = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), camera.center, camera.eye));
                    //freeCam.forward[1] = 0;
                }
                freeCam.used = !freeCam.used;
            } else if (keyEvent.code == "Numpad1") {
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
    
    let uri = 'https://raw.githubusercontent.com/GraphicsProgramming/deccer-cubes/refs/heads/main/SM_Deccer_Cubes_Colored.glb';
    uri = 'https://raw.githubusercontent.com/GraphicsProgramming/deccer-cubes/refs/heads/main/SM_Deccer_Cubes_Textured_Complex.gltf';
    //uri = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/DragonAttenuation/glTF-Binary/DragonAttenuation.glb';
    //uri = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/ABeautifulGame/glTF/ABeautifulGame.gltf';
    //uri = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Sponza/glTF/Sponza.gltf';
    impostorRenderers = await dataLoader.LoadDataGltfUri(uri);

    let svp = CreateViewProjection(gpu.canvas.width/gpu.canvas.height, [45, 0, 0], [0,0,0], [0,1,0], 20);
    let frustum = GetViewFrustum(svp.viewMatrix, svp.projectionMatrix);
    let frustumPoints = dataLoader.GetPointsFromVerticesAndIndices(frustum.corners, frustum.triangles, false, false);
    impostorRenderers.push(CreateImpostorRendererFromPoints(gpu.device, gpu.format, frustumPoints, vec3.fromValues(1, 0, 1), 2));
    impostorRenderers.push(CreateImpostorRendererFromVectors(gpu.device, gpu.format, frustum.normalsTest, vec3.fromValues(1, 0, 0), 1));
}

Initialize();
