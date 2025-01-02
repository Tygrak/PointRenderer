import { mat4, vec3 } from "gl-matrix";
import { CreateGPUBuffer } from "./helper";
import { CreateLineGeometry, CreateSphereGeometry } from "./meshHelpers";
import shaderGrid from './shaders/grid.wgsl';

const GridScale = 0.05;

export class AxisMesh {
    device: GPUDevice;
    pipeline: GPURenderPipeline;
    positions: Float32Array;
    colors: Float32Array;
    
    linesNumberOfVertices: number = -1;
    linesVertexBuffer: GPUBuffer;
    linesColorBuffer: GPUBuffer;
    mvpUniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;

    constructor (device: GPUDevice, format: GPUTextureFormat) {
        this.device = device;
        let t0 = performance.now();
        let positions = [];
        let colors = [];
        let lineGeometry = CreateLineGeometry(vec3.fromValues(-10000, 0, 0), vec3.fromValues(10000, 0, 0), GridScale, 1);
        positions.push(...lineGeometry.positions);
        colors.push(...lineGeometry.positions.map((v, i) => i%3 == 0 ? 1 : 0));

        lineGeometry = CreateLineGeometry(vec3.fromValues(0, -10000, 0), vec3.fromValues(0, 10000, 0), GridScale, 1);
        positions.push(...lineGeometry.positions);
        colors.push(...lineGeometry.positions.map((v, i) => i%3 == 1 ? 1 : 0));

        lineGeometry = CreateLineGeometry(vec3.fromValues(0, 0, -10000), vec3.fromValues(0, 0, 10000), GridScale, 1);
        positions.push(...lineGeometry.positions);
        colors.push(...lineGeometry.positions.map((v, i) => i%3 == 2 ? 1 : 0));
        this.positions = new Float32Array(positions);
        this.colors = new Float32Array(colors);
        let t1 = performance.now();

        this.linesNumberOfVertices = this.positions.length / 3;
        this.linesVertexBuffer = CreateGPUBuffer(device, this.positions);
        this.linesColorBuffer = CreateGPUBuffer(device, this.colors);

        this.pipeline = device.createRenderPipeline({
            layout:'auto',
            vertex: {
                module: device.createShaderModule({
                    code: shaderGrid
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
                    code: shaderGrid
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

        this.mvpUniformBuffer = device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.uniformBindGroup = device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.mvpUniformBuffer,
                    }
                }
            ]
        });
    }

    public DrawStructure(renderPass: GPURenderPassEncoder, mvpMatrix: mat4) {
        let numberOfVerticesToDraw = this.linesNumberOfVertices;
        this.device.queue.writeBuffer(this.mvpUniformBuffer, 0, mvpMatrix as ArrayBuffer);
        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.uniformBindGroup);
        renderPass.setVertexBuffer(0, this.linesVertexBuffer);
        renderPass.setVertexBuffer(1, this.linesColorBuffer);
        renderPass.draw(numberOfVerticesToDraw);
    }
}