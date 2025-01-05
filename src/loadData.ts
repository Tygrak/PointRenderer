import { mat4, quat, vec3 } from "gl-matrix";
import { Point } from "./point";
import { PLYLoader } from './plyLoader';
import { GltfLoader } from "gltf-loader-ts";
import { CreateModelMatrix } from "./helper";
import { ImpostorRenderer } from "./impostorRenderer";
import { Node } from "gltf-loader-ts/lib/gltf";


export const LoadDataGltf = async (device: GPUDevice, format: GPUTextureFormat) => {
    let loader = new GltfLoader();
    let uri = 'https://raw.githubusercontent.com/GraphicsProgramming/deccer-cubes/refs/heads/main/SM_Deccer_Cubes_Colored.glb';
    //uri = 'https://raw.githubusercontent.com/GraphicsProgramming/deccer-cubes/refs/heads/main/SM_Deccer_Cubes_Textured_Complex.gltf';
    let asset = await loader.load(uri);
    let gltf = asset.gltf;
    await asset.preFetchAll();
    console.log(gltf);
    let meshesPoints: Point[][] = [];
    for (let i = 0; i < gltf.meshes!.length; i++) {
        let mesh = gltf.meshes![i];
        for (let j = 0; j < gltf.meshes![i].primitives.length; j++) {
            let primitive = gltf.meshes![i].primitives[j];
            let positionAccessor = primitive.attributes["POSITION"];
            let positionData = await asset.accessorData(positionAccessor);
            let indicesData = await asset.accessorData(primitive.indices!);
            console.log(mesh.name);
            let rawVertices = ConvertBufferToNumbers(positionData, gltf.accessors![positionAccessor].componentType);
            let vertices: vec3[] = [];
            for (let n = 0; n < rawVertices.length; n=n+3) {
                vertices.push(vec3.fromValues(rawVertices[n], rawVertices[n+1], rawVertices[n+2]));
            }
            console.log(vertices);
            let rawIndices = ConvertBufferToNumbers(indicesData, gltf.accessors![primitive.indices!].componentType);
            let faces: number[][] = [];
            for (let n = 0; n < rawIndices.length; n=n+3) {
                faces.push([rawIndices[n], rawIndices[n+1], rawIndices[n+2]]);
            }
            meshesPoints.push(GetPointsFromVerticesAndIndices(vertices, faces, false, false));
        }
    }

    const ConvertNodeToRenderers = (node: Node, modelMatrix: mat4) => {
        let impostorRenderers: ImpostorRenderer[] = [];
        let mMatrix = mat4.clone(modelMatrix);
        if (node.translation != undefined) {
            mat4.translate(mMatrix, mMatrix, vec3.fromValues(node.translation[0], node.translation[1], node.translation[2]));
        }
        if (node.scale != undefined) {
            mat4.scale(mMatrix, mMatrix, vec3.fromValues(node.scale[0], node.scale[1], node.scale[2]));
        }
        if (node.rotation != undefined) {
            let rotationQuat = quat.fromValues(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
            mat4.multiply(mMatrix, mat4.fromQuat(mat4.create(), rotationQuat), mMatrix);
        }
        if (node.mesh != undefined) {
            let impostorRenderer = new ImpostorRenderer(device, format);
            impostorRenderer.modelMatrix = mMatrix;
            impostorRenderer.LoadPoints(device, meshesPoints[node.mesh]);
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

export const ConvertBufferToNumbers = (buffer: Uint8Array, componentType: number) => {
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
        for (let i = 0; i < buffer.length; i++) {
            numbers.push(view.getInt8(i));
        }
    } else if (componentType == 5121) {
        for (let i = 0; i < buffer.length; i++) {
            numbers.push(view.getUint8(i));
        }
    } else if (componentType == 5122) {
        for (let i = 0; i < buffer.length; i+=2) {
            numbers.push(view.getInt16(i, true));
        }
    } else if (componentType == 5123) {
        for (let i = 0; i < buffer.length; i+=2) {
            numbers.push(view.getUint16(i, true));
        }
    } else if (componentType == 5125) {
        for (let i = 0; i < buffer.length; i+=4) {
            numbers.push(view.getUint32(i, true));
        }
    } else if (componentType == 5126) {
        for (let i = 0; i < buffer.length; i+=4) {
            numbers.push(view.getFloat32(i, true));
        }
    }
    
    return numbers;
}

export const LoadDataObj = (dataString: string, scale: number = 1, normalizeSize = true) => {
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

    return GetPointsFromVerticesAndIndices(vertices, faces, true, normalizeSize);
}

export const LoadDataPly = (dataBuffer: ArrayBuffer, scale: number = 1, normalizeSize = true) => {
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
        points = GetPointsFromVerticesAndNormals(vertices, normals, true, normalizeSize, colors);
    } else {
        points = GetPointsFromVerticesAndIndices(vertices, faces, true, normalizeSize, colors);
    }

    return points;
}

export const MoveVerticesMeanToOrigin = (vertices: vec3[]) => {
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

export const NormalizeVerticesSize = (vertices: vec3[]) => {
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

export const GetPointsFromVerticesAndNormals = (vertices: vec3[], normals: vec3[], moveToOrigin = true, normalizeSize = true, colors: vec3[] = []) => {
    let points : Point[] = [];
    if (moveToOrigin) {
        MoveVerticesMeanToOrigin(vertices);
    }
    if (normalizeSize) {
        NormalizeVerticesSize(vertices);
    }
    for (let i = 0; i < vertices.length; i++) {
        let point = new Point(vertices[i][0], vertices[i][1], vertices[i][2], normals[i][0], normals[i][1], normals[i][2]);
        if (colors.length > i) {
            point.r = colors[i][0];
            point.g = colors[i][1];
            point.b = colors[i][2];
        }
        points.push(point);
    }
    return points;
}

export const GetPointsFromVerticesAndIndices = (vertices: vec3[], faces: number[][], moveToOrigin = true,  normalizeSize = true, colors: vec3[] = []) => {
    let points : Point[] = [];
    let limitMaxSize = 0;
    if (moveToOrigin) {
        MoveVerticesMeanToOrigin(vertices);
    }
    if (normalizeSize) {
        NormalizeVerticesSize(vertices);
    }
    for (let i = 0; i < faces.length; i++) {
        const v0 = vertices[faces[i][0]];
        const v1 = vertices[faces[i][1]];
        const v2 = vertices[faces[i][2]];
        const a = vec3.sub([0,0,0], v1, v0);
        const b = vec3.sub([0,0,0], v2, v0);
        const normal = vec3.normalize([0,0,0], vec3.cross([0,0,0], a, b));
        let barycenter = vec3.fromValues((v0[0]+v1[0]+v2[0])/3, (v0[1]+v1[1]+v2[1])/3, (v0[2]+v1[2]+v2[2])/3);
        let point = new Point(barycenter[0], barycenter[1], barycenter[2], normal[0], normal[1], normal[2]);
        let dist = Math.max(vec3.dist(v0, barycenter), vec3.dist(v1, barycenter), vec3.dist(v2, barycenter));
        point.size = dist*1.9;
        if (colors.length > faces[i][0]) {
            point.r = colors[faces[i][0]][0];
            point.g = colors[faces[i][0]][1];
            point.b = colors[faces[i][0]][2];
        }
        if (points.length > 10000000) {
            console.log("too many points, stopping");
            break;
        }
        points.push(point);
    }
    if (faces.length == 0) {
        console.log("point cloud doesn't contain faces, no normals generated");
        for (let i = 0; i < vertices.length; i++) {
            points.push(new Point(vertices[i][0], vertices[i][1], vertices[i][2], 0, 1, 0));
        }
    }
    return points;
}
