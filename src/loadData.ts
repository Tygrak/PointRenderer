import { mat4, quat, vec3 } from "gl-matrix";
import { Point } from "./point";
import { PLYLoader } from './plyLoader';
import { GltfAsset, GltfLoader } from "gltf-loader-ts";
import { lerp } from "./helper";
import { ImpostorRenderer } from "./impostorRenderer";
import { Node } from "gltf-loader-ts/lib/gltf";

export class DataLoader {
    device: GPUDevice;
    format: GPUTextureFormat;
    MaxTrianglePoints = 5;
    DefaultColor = vec3.fromValues(1.0, 1.0, 1.0);

    constructor (device: GPUDevice, format: GPUTextureFormat) {
        this.device = device;
        this.format = format;
    }

    public async LoadDataGltfFile(filemap: Map<string, File>) {
        let loader = new GltfLoader();
        let asset = await loader.loadFromFiles(filemap);
        return this.LoadDataGltf(asset);
    }

    public async LoadDataGltfUri(uri: string) {
        let loader = new GltfLoader();
        let asset = await loader.load(uri);
        return this.LoadDataGltf(asset);
    }

    public async LoadDataGltf(asset: GltfAsset) {
        let gltf = asset.gltf;
        await asset.preFetchAll();
        console.log(gltf);
        let meshesPoints: Point[][] = [];
        for (let i = 0; i < gltf.meshes!.length; i++) {
            let points: Point[] = [];
            let mesh = gltf.meshes![i];
            for (let j = 0; j < gltf.meshes![i].primitives.length; j++) {
                let primitive = gltf.meshes![i].primitives[j];
                let positionAccessor = gltf.accessors![primitive.attributes["POSITION"]];
                let positionData = await asset.accessorData(primitive.attributes["POSITION"]);
                let indicesData = await asset.accessorData(primitive.indices!);
                console.log(mesh.name + " " + j);
                let rawVertices = this.ConvertBufferToNumbers(positionData, positionAccessor.componentType, positionAccessor.count*3);
                let vertices: vec3[] = [];
                for (let n = 0; n < rawVertices.length; n=n+3) {
                    vertices.push(vec3.fromValues(rawVertices[n], rawVertices[n+1], rawVertices[n+2]));
                }
                //console.log(vertices);
                let normals: vec3[] = [];
                if (primitive.attributes["NORMAL"] != undefined) {
                    let normalAccessor = gltf.accessors![primitive.attributes["NORMAL"]];
                    let normalData = await asset.accessorData(primitive.attributes["NORMAL"]);
                    let rawNormals = this.ConvertBufferToNumbers(normalData, normalAccessor.componentType, normalAccessor.count*3);
                    for (let n = 0; n < rawNormals.length; n=n+3) {
                        normals.push(vec3.fromValues(rawNormals[n], rawNormals[n+1], rawNormals[n+2]));
                    }
                }
                let rawIndices = this.ConvertBufferToNumbers(indicesData, gltf.accessors![primitive.indices!].componentType, gltf.accessors![primitive.indices!].count);
                let faces: number[][] = [];
                for (let n = 0; n < rawIndices.length; n=n+3) {
                    if (rawIndices[n] >= vertices.length || rawIndices[n+1] >= vertices.length || rawIndices[n+2] >= vertices.length) {
                        continue;
                    }
                    faces.push([rawIndices[n], rawIndices[n+1], rawIndices[n+2]]);
                }
                let meshPoints = this.GetPointsFromVerticesAndIndices(vertices, faces, false, false, [], normals);
                for (let point = 0; point < meshPoints.length; point++) {
                    points.push(meshPoints[point]);
                }
            }
            meshesPoints.push(points);
        }

        const ConvertNodeToRenderers = (node: Node, modelMatrix: mat4) => {
            let impostorRenderers: ImpostorRenderer[] = [];
            let mMatrix = mat4.clone(modelMatrix);
            if (node.translation != undefined) {
                mat4.translate(mMatrix, mMatrix, vec3.fromValues(node.translation[0], node.translation[1], node.translation[2]));
            }
            if (node.rotation != undefined) {
                let rotationQuat = quat.fromValues(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
                mat4.multiply(mMatrix, mMatrix, mat4.fromQuat(mat4.create(), rotationQuat));
            }
            if (node.scale != undefined) {
                mat4.scale(mMatrix, mMatrix, vec3.fromValues(node.scale[0], node.scale[1], node.scale[2]));
            }
            if (node.mesh != undefined) {
                let impostorRenderer = new ImpostorRenderer(this.device, this.format);
                impostorRenderer.modelMatrix = mMatrix;
                impostorRenderer.LoadPoints(this.device, meshesPoints[node.mesh]);
                impostorRenderers.push(impostorRenderer);
            }
            if (node.children != undefined) {
                for (let i = 0; i < node.children.length; i++) {
                    let child = gltf.nodes![node.children[i]];
                    impostorRenderers.push(...ConvertNodeToRenderers(child, mMatrix));
                }
            }
            return impostorRenderers;
        }

        let impostorRenderers: ImpostorRenderer[] = [];
        if (gltf.scenes != undefined && gltf.scenes.length > 0) {
            let scene = gltf.scenes[0];
            for (let i = 0; i < scene.nodes!.length; i++) {
                let node = gltf.nodes![scene.nodes![i]];
                impostorRenderers.push(...ConvertNodeToRenderers(node, mat4.identity(mat4.create())));
            }
        }
        console.log(meshesPoints);
        return impostorRenderers; 
    }

    public ConvertBufferToNumbers(buffer: Uint8Array, componentType: number, count: number) {
        let numbers: number[] = [];
        let view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        /*
        5120 | signed byte | Signed, two’s complement | 8
        5121 | unsigned byte | Unsigned | 8
        5122 | signed short | Signed, two’s complement | 16
        5123 | unsigned short | Unsigned | 16
        5125 | unsigned int | Unsigned | 32
        5126 | float | Signed | 32
        */
        if (componentType == 5120) {
            for (let i = 0; i < buffer.length && i < count; i++) {
                numbers.push(view.getInt8(i));
            }
        } else if (componentType == 5121) {
            for (let i = 0; i < buffer.length && i < count; i++) {
                numbers.push(view.getUint8(i));
            }
        } else if (componentType == 5122) {
            for (let i = 0; i < buffer.length && i < count*2; i+=2) {
                numbers.push(view.getInt16(i, true));
            }
        } else if (componentType == 5123) {
            for (let i = 0; i < buffer.length && i < count*2; i+=2) {
                numbers.push(view.getUint16(i, true));
            }
        } else if (componentType == 5125) {
            for (let i = 0; i < buffer.length && i < count*4; i+=4) {
                numbers.push(view.getUint32(i, true));
            }
        } else if (componentType == 5126) {
            for (let i = 0; i < buffer.length && i < count*4; i+=4) {
                numbers.push(view.getFloat32(i, true));
            }
        }
        
        return numbers;
    }

    public LoadDataObj(dataString: string, scale: number = 1, normalizeSize = true) {
        let lines = dataString.split("\n");
        let vertices: vec3[] = [];
        let faces: number[][] = [];
        let sums = {x: 0, y: 0, z: 0};
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match = line.match(/^v +(-?\d+\.?\d*(?:e\+?\-?\d+)?) (-?\d+\.?\d*(?:e\+?\-?\d+)?) (-?\d+\.?\d*(?:e\+?\-?\d+)?)/);
            if (match != null) {
                const position = vec3.fromValues(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
                vertices.push(position);
            } else {
                match = line.match(/^f +(\d+)(?:\/\d*)* +(\d+)(?:\/\d*)* +(\d+)(?:\/\d*)*/);
                if (match != null) {
                    faces.push([parseInt(match[1])-1, parseInt(match[2])-1, parseInt(match[3])-1]);
                }
            }
        }

        return this.GetPointsFromVerticesAndIndices(vertices, faces, true, normalizeSize);
    }

    public LoadDataPly(dataBuffer: ArrayBuffer, scale: number = 1, normalizeSize = true) {
        let loader = new PLYLoader();
        let result = loader.parse(dataBuffer);
        console.log(result);
        let vertices: vec3[] = [];
        let faces: number[][] = [];
        let colors: vec3[] = [];
        for (let i = 0; i < result.vertices.length; i=i+3) {
            vertices.push(vec3.fromValues(result.vertices[i], result.vertices[i+1], result.vertices[i+2]));
        }
        for (let i = 0; i < result.indices.length; i=i+3) {
            faces.push([result.indices[i], result.indices[i+1], result.indices[i+2]]);
        }
        for (let i = 0; i < result.colors.length; i=i+3) {
            colors.push(vec3.fromValues(result.colors[i], result.colors[i+1], result.colors[i+2]));
        }
        let points: Point[] = [];
        if (faces.length == 0 && result.normals.length > 0) {
            let normals: vec3[] = [];
            for (let i = 0; i < result.normals.length; i=i+3) {
                normals.push(vec3.fromValues(result.normals[i], result.normals[i+1], result.normals[i+2]));
            }
            points = this.GetPointsFromVerticesAndNormals(vertices, normals, true, normalizeSize, colors);
        } else {
            points = this.GetPointsFromVerticesAndIndices(vertices, faces, true, normalizeSize, colors);
        }

        return points;
    }

    public MoveVerticesMeanToOrigin(vertices: vec3[]) {
        let sums = {x: 0, y: 0, z: 0};
        for (let i = 0; i < vertices.length; i++) {
            sums.x += vertices[i][0];
            sums.y += vertices[i][1];
            sums.z += vertices[i][2];
        }
        for (let i = 0; i < vertices.length; i++) {
            vertices[i][0] = vertices[i][0] - (sums.x/vertices.length);
            vertices[i][1] = vertices[i][1] - (sums.y/vertices.length);
            vertices[i][2] = vertices[i][2] - (sums.z/vertices.length);
        }
    }

    public NormalizeVerticesSize(vertices: vec3[]) {
        let limitMaxSize = 0;
        for (let i = 0; i < vertices.length; i++) {
            limitMaxSize = Math.max(limitMaxSize, Math.max(Math.max(vertices[i][0], vertices[i][1]), vertices[i][2]));
        }
        for (let i = 0; i < vertices.length; i++) {
            vertices[i][0] = vertices[i][0]*(20/limitMaxSize);
            vertices[i][1] = vertices[i][1]*(20/limitMaxSize);
            vertices[i][2] = vertices[i][2]*(20/limitMaxSize);
        }
    }

    public GetPointsFromVerticesAndNormals(vertices: vec3[], normals: vec3[], moveToOrigin = true, normalizeSize = true, colors: vec3[] = []) {
        let points : Point[] = [];
        if (moveToOrigin) {
            this.MoveVerticesMeanToOrigin(vertices);
        }
        if (normalizeSize) {
            this.NormalizeVerticesSize(vertices);
        }
        for (let i = 0; i < vertices.length; i++) {
            let point = new Point(vertices[i][0], vertices[i][1], vertices[i][2], normals[i][0], normals[i][1], normals[i][2]);
            if (colors.length > i) {
                point.r = colors[i][0]; point.g = colors[i][1]; point.b = colors[i][2];
            } else {
                point.r = this.DefaultColor[0]; point.g = this.DefaultColor[1]; point.b = this.DefaultColor[2];
            }
            points.push(point);
        }
        return points;
    }

    public GeneratePointsWithinTriangle(vertices: vec3[], colors: vec3[] = [], normals: vec3[] = []) {
        let points : Point[] = [];
        const v0 = vertices[0];
        const v1 = vertices[1];
        const v2 = vertices[2];
        const a = vec3.sub([0,0,0], v1, v0);
        const b = vec3.sub([0,0,0], v2, v0);
        const computedNormal = vec3.normalize([0,0,0], vec3.cross([0,0,0], a, b));
        const n0 = normals.length > 0 ? normals[0] : computedNormal;
        const n1 = normals.length > 1 ? normals[1] : computedNormal;
        const n2 = normals.length > 2 ? normals[2] : computedNormal;
        const c0 = colors.length > 0 ? colors[0] : vec3.fromValues(1, 1, 1);
        const c1 = colors.length > 1 ? colors[1] : vec3.fromValues(1, 1, 1);
        const c2 = colors.length > 2 ? colors[2] : vec3.fromValues(1, 1, 1);
        let aDist = vec3.dist(v1, v0);
        let bDist = vec3.dist(v2, v0);
        let aStep = aDist/this.MaxTrianglePoints > 0.25 ? aDist/this.MaxTrianglePoints : 0.25;
        let bStep = bDist/this.MaxTrianglePoints > 0.25 ? bDist/this.MaxTrianglePoints : 0.25;
        for (let i = 0; i <= aDist+0.00001; i+=aStep) {
            if (aDist < 0.25) {
                i = aDist/2;
            }
            const ta = i/aDist;
            const va = vec3.fromValues(lerp(v1[0], v0[0], ta), lerp(v1[1], v0[1], ta), lerp(v1[2], v0[2], ta));
            const na = vec3.fromValues(lerp(n1[0], n0[0], ta), lerp(n1[1], n0[1], ta), lerp(n1[2], n0[2], ta));
            const ca = vec3.fromValues(lerp(c1[0], c0[0], ta), lerp(c1[1], c0[1], ta), lerp(c1[2], c0[2], ta));
            for (let j = 0; j <= bDist+0.00001; j+=bStep) {
                if (bDist < 0.25) {
                    j = bDist/2;
                }
                const tb = j/bDist;
                let position = vec3.fromValues(lerp(v2[0], va[0], tb), lerp(v2[1], va[1], tb), lerp(v2[2], va[2], tb));
                let normal = vec3.fromValues(lerp(n2[0], na[0], tb), lerp(n2[1], na[1], tb), lerp(n2[2], na[2], tb));
                let color = vec3.fromValues(lerp(c2[0], ca[0], tb), lerp(c2[1], ca[1], tb), lerp(c2[2], ca[2], tb));
                let point = new Point(position[0], position[1], position[2], normal[0], normal[1], normal[2]);
                point.r = color[0]; point.g = color[1]; point.b = color[2];
                point.size = aDist < 0.25 && bDist < 0.25 ? (aDist+bDist)*0.725 : (aStep+bStep)*0.725;
                points.push(point);
            }
        }
        return points;
    }

    public GetPointsFromVerticesAndIndices(vertices: vec3[], faces: number[][], moveToOrigin = true,  normalizeSize = true, colors: vec3[] = [], normals: vec3[] = []) {
        let points : Point[] = [];
        let limitMaxSize = 0;
        if (moveToOrigin) {
            this.MoveVerticesMeanToOrigin(vertices);
        }
        if (normalizeSize) {
            this.NormalizeVerticesSize(vertices);
        }
        const defaultColor = vec3.fromValues(this.DefaultColor[0], this.DefaultColor[1], this.DefaultColor[2]);
        for (let i = 0; i < faces.length; i++) {
            const v0 = vertices[faces[i][0]];
            const v1 = vertices[faces[i][1]];
            const v2 = vertices[faces[i][2]];
            const a = vec3.sub([0,0,0], v1, v0);
            const b = vec3.sub([0,0,0], v2, v0);
            const normal = vec3.normalize([0,0,0], vec3.cross([0,0,0], a, b));
            let barycenter = vec3.fromValues((v0[0]+v1[0]+v2[0])/3, (v0[1]+v1[1]+v2[1])/3, (v0[2]+v1[2]+v2[2])/3);
            let point = new Point(barycenter[0], barycenter[1], barycenter[2], normal[0], normal[1], normal[2]);
            let distToCenter0 = vec3.dist(v0, barycenter);
            let distToCenter1 = vec3.dist(v1, barycenter);
            let distToCenter2 = vec3.dist(v2, barycenter);
            let dist = Math.max(distToCenter0, distToCenter1, distToCenter2);
            point.size = dist*1.9;
            let c0 = defaultColor;
            let c1 = defaultColor;
            let c2 = defaultColor;
            if (colors.length > faces[i][0]) {
                c0 = colors[faces[i][0]];
                c1 = colors[faces[i][1]];
                c2 = colors[faces[i][2]];
            }
            if (normals.length > faces[i][0]) {
                const n0 = normals[faces[i][0]];
                const n1 = normals[faces[i][1]];
                const n2 = normals[faces[i][2]];
                points.push(...this.GeneratePointsWithinTriangle([v0, v1, v2], [c0, c1, c2], [n0, n1, n2]));
            } else {
                points.push(...this.GeneratePointsWithinTriangle([v0, v1, v2], [c0, c1, c2], []));
            }
            if (points.length > 12000000) {
                console.log("too many points, stopping");
                break;
            }
            
        }
        if (faces.length == 0) {
            console.log("point cloud doesn't contain faces, no normals generated");
            for (let i = 0; i < vertices.length; i++) {
                points.push(new Point(vertices[i][0], vertices[i][1], vertices[i][2], 0, 1, 0));
            }
        }
        return points;
    }
}
