import { vec2, vec3, vec4 } from "gl-matrix";
import { Point } from "./point";

export function CubeData() {
    const positions = new Float32Array([
        // front
        -1, -1,  1,  
         1, -1,  1,  
         1,  1,  1,
         1,  1,  1,
        -1,  1,  1,
        -1, -1,  1,

        // right
         1, -1,  1,
         1, -1, -1,
         1,  1, -1,
         1,  1, -1,
         1,  1,  1,
         1, -1,  1,

        // back
        -1, -1, -1,
        -1,  1, -1,
         1,  1, -1,
         1,  1, -1,
         1, -1, -1,
        -1, -1, -1,

        // left
        -1, -1,  1,
        -1,  1,  1,
        -1,  1, -1,
        -1,  1, -1,
        -1, -1, -1,
        -1, -1,  1,

        // top
        -1,  1,  1,
         1,  1,  1,
         1,  1, -1,
         1,  1, -1,
        -1,  1, -1,
        -1,  1,  1,

        // bottom
        -1, -1,  1,
        -1, -1, -1,
         1, -1, -1,
         1, -1, -1,
         1, -1,  1,
        -1, -1,  1
    ]);

    const colors = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        1, 1, 0,
        1, 1, 0,
        1, 1, 0,
        1, 1, 0,
        1, 1, 0,
        1, 1, 0,

        0, 1, 1,
        0, 1, 1,
        0, 1, 1,
        0, 1, 1,
        0, 1, 1,
        0, 1, 1,

        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        1, 0, 1,
        1, 0, 1,
        1, 0, 1,
        1, 0, 1,
        1, 0, 1,
        1, 0, 1
    ]);

    return {
        positions,
        colors
    };
}

export function CreateLineGeometry(a: vec3, b: vec3, radius: number, arity: number = 1) {
    const dir = vec3.subtract(vec3.create(), a, b);
    const ortho1 = ArbitraryOrthogonalVector(dir);
    const ortho2 = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), dir, ortho1));
    let resultPositions;
    if (arity == 2) {
        const p1 = vec3.fromValues(
            a[0]+ortho1[0]*radius+ortho2[0]*radius+ortho1[0]*radius*2.1, 
            a[1]+ortho1[1]*radius+ortho2[1]*radius+ortho1[1]*radius*2.1, 
            a[2]+ortho1[2]*radius+ortho2[2]*radius+ortho1[2]*radius*2.1);
        const p2 = vec3.fromValues(
            a[0]+ortho1[0]*radius-ortho2[0]*radius+ortho1[0]*radius*2.1, 
            a[1]+ortho1[1]*radius-ortho2[1]*radius+ortho1[1]*radius*2.1, 
            a[2]+ortho1[2]*radius-ortho2[2]*radius+ortho1[2]*radius*2.1);
        const p3 = vec3.fromValues(
            a[0]-ortho1[0]*radius+ortho1[0]*radius*2.1, 
            a[1]-ortho1[1]*radius+ortho1[1]*radius*2.1, 
            a[2]-ortho1[2]*radius+ortho1[2]*radius*2.1);
        const p4 = vec3.fromValues(
            b[0]+ortho1[0]*radius+ortho2[0]*radius+ortho1[0]*radius*2.1, 
            b[1]+ortho1[1]*radius+ortho2[1]*radius+ortho1[1]*radius*2.1, 
            b[2]+ortho1[2]*radius+ortho2[2]*radius+ortho1[2]*radius*2.1);
        const p5 = vec3.fromValues(
            b[0]+ortho1[0]*radius-ortho2[0]*radius+ortho1[0]*radius*2.1, 
            b[1]+ortho1[1]*radius-ortho2[1]*radius+ortho1[1]*radius*2.1, 
            b[2]+ortho1[2]*radius-ortho2[2]*radius+ortho1[2]*radius*2.1);
        const p6 = vec3.fromValues(
            b[0]-ortho1[0]*radius+ortho1[0]*radius*2.1, 
            b[1]-ortho1[1]*radius+ortho1[1]*radius*2.1, 
            b[2]-ortho1[2]*radius+ortho1[2]*radius*2.1);
        const p7 = vec3.fromValues(
            a[0]+ortho1[0]*radius+ortho2[0]*radius-ortho1[0]*radius*2.1, 
            a[1]+ortho1[1]*radius+ortho2[1]*radius-ortho1[1]*radius*2.1, 
            a[2]+ortho1[2]*radius+ortho2[2]*radius-ortho1[2]*radius*2.1);
        const p8 = vec3.fromValues(
            a[0]+ortho1[0]*radius-ortho2[0]*radius-ortho1[0]*radius*2.1, 
            a[1]+ortho1[1]*radius-ortho2[1]*radius-ortho1[1]*radius*2.1, 
            a[2]+ortho1[2]*radius-ortho2[2]*radius-ortho1[2]*radius*2.1);
        const p9 = vec3.fromValues(
            a[0]-ortho1[0]*radius-ortho1[0]*radius*2.1, 
            a[1]-ortho1[1]*radius-ortho1[1]*radius*2.1, 
            a[2]-ortho1[2]*radius-ortho1[2]*radius*2.1);
        const p10 = vec3.fromValues(
            b[0]+ortho1[0]*radius+ortho2[0]*radius-ortho1[0]*radius*2.1, 
            b[1]+ortho1[1]*radius+ortho2[1]*radius-ortho1[1]*radius*2.1, 
            b[2]+ortho1[2]*radius+ortho2[2]*radius-ortho1[2]*radius*2.1);
        const p11 = vec3.fromValues(
            b[0]+ortho1[0]*radius-ortho2[0]*radius-ortho1[0]*radius*2.1, 
            b[1]+ortho1[1]*radius-ortho2[1]*radius-ortho1[1]*radius*2.1, 
            b[2]+ortho1[2]*radius-ortho2[2]*radius-ortho1[2]*radius*2.1);
        const p12 = vec3.fromValues(
            b[0]-ortho1[0]*radius-ortho1[0]*radius*2.1, 
            b[1]-ortho1[1]*radius-ortho1[1]*radius*2.1, 
            b[2]-ortho1[2]*radius-ortho1[2]*radius*2.1);
        resultPositions = new Float32Array([
            ...p1, ...p4, ...p6,
            ...p1, ...p6, ...p4,
            ...p1, ...p6, ...p3,
            ...p1, ...p3, ...p6,
            
            ...p1, ...p4, ...p5,
            ...p1, ...p5, ...p4,
            ...p1, ...p2, ...p5,
            ...p1, ...p5, ...p2,
            
            ...p2, ...p5, ...p6,
            ...p2, ...p6, ...p5,
            ...p2, ...p3, ...p6,
            ...p2, ...p6, ...p3,
            
            ...p7, ...p10, ...p12,
            ...p7, ...p12, ...p10,
            ...p7, ...p12, ...p9,
            ...p7, ...p9, ...p12,
            
            ...p7, ...p10, ...p11,
            ...p7, ...p11, ...p10,
            ...p7, ...p8, ...p11,
            ...p7, ...p11, ...p8,
            
            ...p8, ...p11, ...p12,
            ...p8, ...p12, ...p11,
            ...p8, ...p9, ...p12,
            ...p8, ...p12, ...p9,
        ]);
    } else {
        const p1 = vec3.fromValues(
            a[0]+ortho1[0]*radius+ortho2[0]*radius, 
            a[1]+ortho1[1]*radius+ortho2[1]*radius, 
            a[2]+ortho1[2]*radius+ortho2[2]*radius);
        const p2 = vec3.fromValues(
            a[0]+ortho1[0]*radius-ortho2[0]*radius, 
            a[1]+ortho1[1]*radius-ortho2[1]*radius, 
            a[2]+ortho1[2]*radius-ortho2[2]*radius);
        const p3 = vec3.fromValues(
            a[0]-ortho1[0]*radius, 
            a[1]-ortho1[1]*radius, 
            a[2]-ortho1[2]*radius);
        const p4 = vec3.fromValues(
            b[0]+ortho1[0]*radius+ortho2[0]*radius, 
            b[1]+ortho1[1]*radius+ortho2[1]*radius, 
            b[2]+ortho1[2]*radius+ortho2[2]*radius);
        const p5 = vec3.fromValues(
            b[0]+ortho1[0]*radius-ortho2[0]*radius, 
            b[1]+ortho1[1]*radius-ortho2[1]*radius, 
            b[2]+ortho1[2]*radius-ortho2[2]*radius);
        const p6 = vec3.fromValues(
            b[0]-ortho1[0]*radius, 
            b[1]-ortho1[1]*radius, 
            b[2]-ortho1[2]*radius);
        resultPositions = new Float32Array([
            ...p1, ...p4, ...p6,
            ...p1, ...p6, ...p4,
            ...p1, ...p6, ...p3,
            ...p1, ...p3, ...p6,
            
            ...p1, ...p4, ...p5,
            ...p1, ...p5, ...p4,
            ...p1, ...p2, ...p5,
            ...p1, ...p5, ...p2,
            
            ...p2, ...p5, ...p6,
            ...p2, ...p6, ...p5,
            ...p2, ...p3, ...p6,
            ...p2, ...p6, ...p3,
        ]);
    }
    return {positions: resultPositions, colors: new Float32Array(resultPositions.length).map((v) => 1)};
}

export function ArbitraryOrthogonalVector(v: vec3) {
    let arbitraryNonParallelVec = Math.abs(Math.abs(vec3.normalize(vec3.create(), v)[0])-1.0) > 0.001 ? vec3.fromValues(1.0, 0.0, 0.0) : vec3.fromValues(0.0, 1.0, 0.0);
    let orthogonal = vec3.cross(vec3.create(), v, arbitraryNonParallelVec);
    return vec3.normalize(orthogonal, orthogonal);
}

export function CreateQuadGeometry(point: Point) {
    let v = vec3.fromValues(point.x, point.y, point.z);
    let resultPositions = new Float32Array([
        ...v, 
        ...v,
        ...v,

        ...v,
        ...v,
        ...v,
    ]);
    let color = point.GetColor();
    let resultColors = new Float32Array([
        ...color, 
        ...color,
        ...color,

        ...color,
        ...color,
        ...color,
    ]);
    let i = vec3.fromValues(0, 1, 0);
    let normals = new Float32Array([
        ...i, 
        ...i,
        ...i,

        ...i,
        ...i,
        ...i,
    ]);
    let sizes = new Float32Array([1, 1]);
    return {positions: resultPositions, color: resultColors, normals: normals, sizes: sizes};
}

// https://www.songho.ca/opengl/gl_sphere.html
export function CreateSphereGeometry(radius: number, sectorCount: number, stackCount: number) {
    let x, y, z, xy;                              // vertex position
    let nx, ny, nz, lengthInv = 1.0 / radius;     // vertex normal
    let s, t;                                     // vertex texCoord

    let sectorStep = 2 * Math.PI / sectorCount;
    let stackStep = Math.PI / stackCount;
    let sectorAngle, stackAngle;
    
    let vertices = [];

    for(let i = 0; i <= stackCount; i++)  {
        stackAngle = Math.PI / 2 - i * stackStep;        // starting from pi/2 to -pi/2
        xy = radius * Math.cos(stackAngle);             // r * cos(u)
        z = radius * Math.sin(stackAngle);              // r * sin(u)

        // add (sectorCount+1) vertices per stack
        // the first and last vertices have same position and normal, but different tex coords
        for(let j = 0; j <= sectorCount; ++j) {
            sectorAngle = j * sectorStep;           // starting from 0 to 2pi
            // vertex position (x, y, z)
            x = xy * Math.cos(sectorAngle);             // r * cos(u) * cos(v)
            y = xy * Math.sin(sectorAngle);             // r * cos(u) * sin(v)
            vertices.push(x);
            vertices.push(y);
            vertices.push(z);
            /*// normalized vertex normal (nx, ny, nz)
            nx = x * lengthInv;
            ny = y * lengthInv;
            nz = z * lengthInv;
            normals.push_back(nx);
            normals.push_back(ny);
            normals.push_back(nz);

            // vertex tex coord (s, t) range between [0, 1]
            s = (float)j / sectorCount;
            t = (float)i / stackCount;
            texCoords.push_back(s);
            texCoords.push_back(t);*/
        }
    }
    let indices = [];
    let k1, k2;
    for(let i = 0; i < stackCount; ++i) {
        k1 = i * (sectorCount + 1);     // beginning of current stack
        k2 = k1 + sectorCount + 1;      // beginning of next stack

        for(let j = 0; j < sectorCount; ++j, ++k1, ++k2)  {
            // 2 triangles per sector excluding first and last stacks
            // k1 => k2 => k1+1
            if(i != 0) {
                indices.push(k1);
                indices.push(k2);
                indices.push(k1 + 1);
            }

            // k1+1 => k2 => k2+1
            if(i != (stackCount-1)) {
                indices.push(k1 + 1);
                indices.push(k2);
                indices.push(k2 + 1);
            }
        }
    }
    let resultPositions = new Float32Array(indices.length*3);
    for (let i = 0; i < indices.length; i++) {
        const index = indices[i];
        resultPositions[i*3] = vertices[index*3];
        resultPositions[i*3+1] = vertices[index*3+1];
        resultPositions[i*3+2] = vertices[index*3+2];
    }
    return {positions: resultPositions, colors: new Float32Array(resultPositions.length).map((v) => 1)};
}