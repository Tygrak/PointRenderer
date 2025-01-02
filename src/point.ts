import { vec3, vec4 } from "gl-matrix";

export class Point {
    x: number;
    y: number;
    z: number;
    
    r: number;
    g: number;
    b: number;

    constructor (x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = 1.0;
        this.g = 1.0;
        this.b = 1.0;
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