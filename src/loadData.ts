import { vec3 } from "gl-matrix";
import { Point } from "./point";

export const LoadDataObj = (dataString: string, scale: number = 1) => {
    let lines = dataString.split("\n");
    let points = [];
    let sums = {x: 0, y: 0, z: 0};
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineParseResult = ParseDataLineObj(line);
        if (lineParseResult == null) {
            continue;
        }
        sums.x += lineParseResult.atom.x;
        sums.y += lineParseResult.atom.y;
        sums.z += lineParseResult.atom.z;
        points.push(lineParseResult.atom);
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
    return points;
}

const ParseDataLineObj = (line: string) => {
    let match = line.match(/^v +(-?\d+\.?\d*(?:e\+?\-?\d+)?) (-?\d+\.?\d*(?:e\+?\-?\d+)?) (-?\d+\.?\d*(?:e\+?\-?\d+)?)/);
    if (match == null) {
        return null;
    }
    const residueAtomName = "C";
    const residueName = "C";
    const chainName = "C";
    const residueId = "C";
    const atomName = "C";
    const position = vec3.fromValues(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
    const atom = new Point(position[0], position[1], position[2]);
    return {residueAtomName, residueName, chainName, residueId, atomName, position, atom};
}


