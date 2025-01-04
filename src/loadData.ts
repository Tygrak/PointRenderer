import { vec3 } from "gl-matrix";
import { Point } from "./point";

export const LoadDataObj = (dataString: string, scale: number = 1, normalizeSize = true) => {
    let lines = dataString.split("\n");
    let points : Point[] = [];
    let vectors = [];
    let faces = [];
    let sums = {x: 0, y: 0, z: 0};
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match = line.match(/^v +(-?\d+\.?\d*(?:e\+?\-?\d+)?) (-?\d+\.?\d*(?:e\+?\-?\d+)?) (-?\d+\.?\d*(?:e\+?\-?\d+)?)/);
        if (match != null) {
            const position = vec3.fromValues(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
            sums.x += position[0];
            sums.y += position[1];
            sums.z += position[2];
            const point = new Point(position[0], position[1], position[2], 0, 1, 0);
            vectors.push(position);
            //points.push(point);
        } else {
            match = line.match(/^f +(\d+)(?:\/\d*)* +(\d+)(?:\/\d*)* +(\d+)(?:\/\d*)*/);
            if (match != null) {
                faces.push([parseInt(match[1])-1, parseInt(match[2])-1, parseInt(match[3])-1]);
            }
        }
    }

    let limitMaxSize = 0;
    for (let i = 0; i < vectors.length; i++) {
        vectors[i][0] = vectors[i][0] - (sums.x/vectors.length);
        vectors[i][1] = vectors[i][1] - (sums.y/vectors.length);
        vectors[i][2] = vectors[i][2] - (sums.z/vectors.length);
        limitMaxSize = Math.max(limitMaxSize, Math.max(Math.max(vectors[i][0], vectors[i][1]), vectors[i][2]));
    }
    if (normalizeSize) {
        for (let i = 0; i < vectors.length; i++) {
            vectors[i][0] = vectors[i][0]*(20/limitMaxSize);
            vectors[i][1] = vectors[i][1]*(20/limitMaxSize);
            vectors[i][2] = vectors[i][2]*(20/limitMaxSize);
        }
    }
    for (let i = 0; i < faces.length; i++) {
        const v0 =vectors[faces[i][0]];
        const v1 =vectors[faces[i][1]];
        const v2 =vectors[faces[i][2]];
        const a = vec3.sub([0,0,0], v1, v0);
        const b = vec3.sub([0,0,0], v2, v0);
        const normal = vec3.normalize([0,0,0], vec3.cross([0,0,0], a, b));
        let barycenter = vec3.fromValues((v0[0]+v1[0]+v2[0])/3, (v0[1]+v1[1]+v2[1])/3, (v0[2]+v1[2]+v2[2])/3);
        let point = new Point(barycenter[0], barycenter[1], barycenter[2], normal[0], normal[1], normal[2]);
        let dist = Math.max(vec3.dist(v0, barycenter), vec3.dist(v1, barycenter), vec3.dist(v2, barycenter));
        point.size = dist*1.9;
        points.push(point);
    }
    //todo calculate normals!!!!
    //console.log(faces);
    return points;
}

