import { vec3, vec4 } from "gl-matrix";

export class Point {
    //pos
    x: number;
    y: number;
    z: number;
    
    //color
    r: number;
    g: number;
    b: number;
    
    //normal
    normal: vec3;

    //size
    size: number;

    constructor (x: number, y: number, z: number, nx: number, ny: number, nz: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = 1.0;
        this.g = 1.0;
        this.b = 1.0;
        this.size = 1.0;
        this.normal = vec3.normalize(vec3.fromValues(0, 0, 0), vec3.fromValues(nx, ny, nz)); 
    }

    public GetPosition() {
        return vec3.fromValues(this.x, this.y, this.z);
    }

    public GetColor() {
        return vec3.fromValues(this.r, this.g, this.b);
    }

    public Distance(point: Point) {
        return vec3.distance(this.GetPosition(), point.GetPosition());
    }
}