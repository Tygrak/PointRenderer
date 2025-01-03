import { vec3 } from "gl-matrix";
import { Point } from "./point";

export const LoadDataObj = (dataString: string, scale: number = 1) => {
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
            points.push(point);
        } else {
            match = line.match(/^f +(-?\d+) (-?\d+) (-?\d+)/);
            if (match != null) {
                faces.push([parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]);
            }
        }
    }

    let limitMaxSize = 0;
    for (let i = 0; i < points.length; i++) {
        points[i].x = points[i].x - (sums.x/points.length);
        points[i].y = points[i].y - (sums.y/points.length);
        points[i].z = points[i].z - (sums.z/points.length);
        limitMaxSize = Math.max(limitMaxSize, Math.max(Math.max(points[i].x, points[i].y), points[i].z));
    }
    for (let i = 0; i < points.length; i++) {
        points[i].x = points[i].x*(20/limitMaxSize);
        points[i].y = points[i].y*(20/limitMaxSize);
        points[i].z = points[i].z*(20/limitMaxSize);
    }
    for (let i = 0; i < faces.length; i++) {
        /*const a = vec3.sub([0,0,0], vectors[faces[i][1]], vectors[faces[i][0]]);
        const b = vec3.sub([0,0,0], vectors[faces[i][2]], vectors[faces[i][0]]);
        const normal = vec3.normalize([0,0,0], vec3.cross([0,0,0], a, b));
        const point = new Point(vectors[faces[i][2]][0], vectors[faces[i][2]][1], vectors[faces[i][2]][2], normal[0], normal[1], normal[2]);*/
        //todo:
        //points.push(point);
    }
    //todo calculate normals!!!!
    //console.log(faces);
    return points;
}

