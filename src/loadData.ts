import { vec3 } from "gl-matrix";
import { Point } from "./point";
import { PLYLoader } from './plyLoader';
import { GltfLoader } from "gltf-loader-ts";

export const LoadDataGltf = async () => {
    let loader = new GltfLoader();
    let uri = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF/BoxTextured.gltf';
    uri = 'https://raw.githubusercontent.com/GraphicsProgramming/deccer-cubes/refs/heads/main/SM_Deccer_Cubes_Textured_Complex.gltf';
    let asset = await loader.load(uri);
    let gltf = asset.gltf;
    console.log(gltf);
    // -> {asset: {…}, scene: 0, scenes: Array(1), nodes: Array(2), meshes: Array(1), …}

    let data = await asset.accessorData(0); // fetches BoxTextured0.bin
    let image = await asset.imageData.get(0);
    console.log(data);
    console.log(image);
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

    return GetPointsFromVerticesAndIndices(vertices, faces, normalizeSize);
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
        points = GetPointsFromVerticesAndNormals(vertices, normals, normalizeSize, colors);
    } else {
        points = GetPointsFromVerticesAndIndices(vertices, faces, normalizeSize, colors);
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

export const GetPointsFromVerticesAndNormals = (vertices: vec3[], normals: vec3[], normalizeSize = true, colors: vec3[] = []) => {
    let points : Point[] = [];
    MoveVerticesMeanToOrigin(vertices);
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

export const GetPointsFromVerticesAndIndices = (vertices: vec3[], faces: number[][], normalizeSize = true, colors: vec3[] = []) => {
    let points : Point[] = [];
    let limitMaxSize = 0;
    MoveVerticesMeanToOrigin(vertices);
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
