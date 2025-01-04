import { vec3 } from "gl-matrix";
import { Point } from "./point";
import { PLYLoader } from './plyLoader';

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
    let vertices: vec3[] = [];
    let faces: number[][] = [];
    for (let i = 0; i < result.vertices.length; i=i+3) {
        vertices.push(vec3.fromValues(result.vertices[i], result.vertices[i+1], result.vertices[i+2]));
    }
    for (let i = 0; i < result.indices.length; i=i+3) {
        faces.push([result.indices[i], result.indices[i+1], result.indices[i+2]]);
    }

    return GetPointsFromVerticesAndIndices(vertices, faces, normalizeSize);
}

export const GetPointsFromVerticesAndIndices = (vertices: vec3[], faces: number[][], normalizeSize = true) => {
    let sums = {x: 0, y: 0, z: 0};
    for (let i = 0; i < vertices.length; i++) {
        sums.x += vertices[i][0];
        sums.y += vertices[i][1];
        sums.z += vertices[i][2];
    }
    let points : Point[] = [];
    let limitMaxSize = 0;
    for (let i = 0; i < vertices.length; i++) {
        vertices[i][0] = vertices[i][0] - (sums.x/vertices.length);
        vertices[i][1] = vertices[i][1] - (sums.y/vertices.length);
        vertices[i][2] = vertices[i][2] - (sums.z/vertices.length);
        limitMaxSize = Math.max(limitMaxSize, Math.max(Math.max(vertices[i][0], vertices[i][1]), vertices[i][2]));
    }
    if (normalizeSize) {
        for (let i = 0; i < vertices.length; i++) {
            vertices[i][0] = vertices[i][0]*(20/limitMaxSize);
            vertices[i][1] = vertices[i][1]*(20/limitMaxSize);
            vertices[i][2] = vertices[i][2]*(20/limitMaxSize);
        }
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
        /*if (points.length > 2000000) {
            console.log("too many points, stopping");
            break;
        }*/
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
