import { mat4, vec3, vec4 } from "gl-matrix";
import { CreateGPUBuffer } from "./helper";
import { CreateQuadGeometry } from "./meshHelpers";
import shader from './shaders/impostor.wgsl';
import { Point } from "./point";
import { AABB } from "./aabb";

export class ImpostorRenderer {
    pointsCount : number = 1;
    drawMode = 0;
    billBoardMode = 0;
    time = 0;
    lightDir = [0.2, 1, 0];
    aabb: AABB = new AABB([0,0,0], [1,1,1]);
    worldAabb: AABB = new AABB([0,0,0], [1,1,1]);
    isStatic = true;
    modelMatrix : mat4 = mat4.identity(mat4.create());
    quadPositions : GPUBuffer;
    quadColors : GPUBuffer;
    quadNormals : GPUBuffer;
    quadSizes : GPUBuffer;
    static pipeline : GPURenderPipeline;
    mvpUniformBuffer : GPUBuffer;
    vUniformBuffer : GPUBuffer;
    mUniformBuffer : GPUBuffer;
    cameraPosBuffer : GPUBuffer;
    uniformBindGroup : GPUBindGroup;

    drawSettingsBuffer : GPUBuffer;
    drawSettingsBindGroup : GPUBindGroup;
    
    constructor (device: GPUDevice, format: GPUTextureFormat) {
        let quad = CreateQuadGeometry(new Point(0, 0, 0, 0, 1, 0));
        this.quadPositions = CreateGPUBuffer(device, quad.positions);
        this.quadColors = CreateGPUBuffer(device, quad.color);
        this.quadNormals = CreateGPUBuffer(device, quad.normals);
        this.quadSizes = CreateGPUBuffer(device, quad.sizes);

        if (ImpostorRenderer.pipeline == undefined) {
            ImpostorRenderer.pipeline = device.createRenderPipeline({
                layout:'auto',
                vertex: {
                    module: device.createShaderModule({                    
                        code: shader
                    }),
                    entryPoint: "vs_main",
                    buffers:[
                        { //position
                            arrayStride: 4*3,
                            stepMode: 'instance',
                            attributes: [{
                                shaderLocation: 0,
                                format: "float32x3",
                                offset: 0
                            }]
                        },
                        { //color
                            arrayStride: 4*3,
                            stepMode: 'instance',
                            attributes: [{
                                shaderLocation: 1,
                                format: "float32x3",
                                offset: 0
                            }]
                        },
                        { //normal
                            arrayStride: 4*3,
                            stepMode: 'instance',
                            attributes: [{
                                shaderLocation: 2,
                                format: "float32x3",
                                offset: 0
                            }]
                        },
                        { //size
                            arrayStride: 4*1,
                            stepMode: 'instance',
                            attributes: [{
                                shaderLocation: 3,
                                format: "float32",
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
                            format: format as GPUTextureFormat
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
        }
        

        this.mvpUniformBuffer = device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.vUniformBuffer = device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.mUniformBuffer = device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.cameraPosBuffer = device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.uniformBindGroup = device.createBindGroup({
            layout: ImpostorRenderer.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.mvpUniformBuffer,
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.vUniformBuffer,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.mUniformBuffer,
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this.cameraPosBuffer,
                    }
                },
            ]
        });

        this.drawSettingsBuffer = device.createBuffer({
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.drawSettingsBindGroup = device.createBindGroup({
            layout: ImpostorRenderer.pipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.drawSettingsBuffer,
                    }
                },
            ]
        });
    }

    public LoadPoints(device: GPUDevice, points: Point[]) {
        this.pointsCount = points.length;
        let positions = new Float32Array(this.pointsCount*3);
        let colors = new Float32Array(this.pointsCount*3);
        let normals = new Float32Array(this.pointsCount*3);
        let sizes = new Float32Array(this.pointsCount*1);
        let boundsMin = vec3.fromValues(1000000000, 1000000000, 1000000000);
        let boundsMax = vec3.fromValues(-1000000000, -1000000000, -1000000000);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            let quad = CreateQuadGeometry(point);
            positions[i*3+0] = point.x;
            positions[i*3+1] = point.y;
            positions[i*3+2] = point.z;
            colors[i*3+0] = quad.color[0];
            colors[i*3+1] = quad.color[1];
            colors[i*3+2] = quad.color[2];
            normals[i*3+0] = point.normal[0];
            normals[i*3+1] = point.normal[1];
            normals[i*3+2] = point.normal[2];
            sizes[i] = point.size;
            
            boundsMax = [Math.max(boundsMax[0], point.x+point.size), Math.max(boundsMax[1], point.y+point.size), Math.max(boundsMax[2], point.z+point.size)]
            boundsMin = [Math.min(boundsMin[0], point.x-point.size), Math.min(boundsMin[1], point.y-point.size), Math.min(boundsMin[2], point.z-point.size)]
        }
        this.aabb = new AABB(boundsMin, boundsMax);
        this.worldAabb = this.aabb.TransformAABB(this.modelMatrix);
        this.quadPositions = CreateGPUBuffer(device, positions);
        this.quadColors = CreateGPUBuffer(device, colors);
        this.quadNormals = CreateGPUBuffer(device, normals);
        this.quadSizes = CreateGPUBuffer(device, sizes);
    }

    public SetModelMatrix(modelMatrix: mat4) {
        this.modelMatrix = modelMatrix;
        if (this.isStatic) {
            this.worldAabb = this.aabb.TransformAABB(modelMatrix);
        }
    }

    public Draw(device: GPUDevice, renderPass : GPURenderPassEncoder, mvpMatrix: mat4, vMatrix: mat4, modelMatrix: mat4, cameraPos: vec3, percentageShown: number, sizeScale: number) {
        device.queue.writeBuffer(this.mvpUniformBuffer, 0, mvpMatrix as ArrayBuffer);
        device.queue.writeBuffer(this.vUniformBuffer, 0, vMatrix as ArrayBuffer);
        device.queue.writeBuffer(this.mUniformBuffer, 0, modelMatrix as ArrayBuffer);
        device.queue.writeBuffer(this.cameraPosBuffer, 0, vec4.fromValues(cameraPos[0], cameraPos[1], cameraPos[2], 1.0) as ArrayBuffer);

        let drawSettingsBuffer = new Float32Array(12);
        drawSettingsBuffer[0] = Math.round(percentageShown*this.pointsCount);
        drawSettingsBuffer[1] = this.drawMode;
        drawSettingsBuffer[2] = this.billBoardMode;
        drawSettingsBuffer[3] = sizeScale;
        drawSettingsBuffer[4] = this.lightDir[0];
        drawSettingsBuffer[5] = this.lightDir[1];
        drawSettingsBuffer[6] = this.lightDir[2];
        drawSettingsBuffer[7] = 0;
        drawSettingsBuffer[8] = this.time;
        drawSettingsBuffer[9] = 0;
        drawSettingsBuffer[10] = 0;
        drawSettingsBuffer[11] = 0;
        device.queue.writeBuffer(this.drawSettingsBuffer, 0, drawSettingsBuffer as ArrayBuffer);

        renderPass.setPipeline(ImpostorRenderer.pipeline);
        renderPass.setBindGroup(0, this.uniformBindGroup);
        renderPass.setBindGroup(1, this.drawSettingsBindGroup);
        renderPass.setVertexBuffer(0, this.quadPositions);
        renderPass.setVertexBuffer(1, this.quadColors);
        renderPass.setVertexBuffer(2, this.quadNormals);
        renderPass.setVertexBuffer(3, this.quadSizes);
        renderPass.draw(6, this.pointsCount);
    }
}