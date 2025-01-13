import { vec3, vec4, mat4 } from "gl-matrix";

export class boundingSphere {
    center: vec3;
    radius: number;

    constructor (center: vec3, radius: number) {
        this.center = center;
        this.radius = radius;
    }

    public InFrustum(camFrustum: vec4[], transform: mat4) {
        let globalScale = mat4.getScaling(vec3.create(), transform);
        let globalCenter = vec4.transformMat4(vec4.create(), vec4.fromValues(this.center[0], this.center[1], this.center[2], 1), transform);

        //To wrap correctly our shape, we need the maximum scale scalar.
        let maxScale = Math.max(globalScale[0], globalScale[1], globalScale[2]);

        //Max scale is assuming for the diameter. So, we need the half to apply it to our radius
        let globalSphere = new boundingSphere(vec3.fromValues(globalCenter[0], globalCenter[1], globalCenter[2]), this.radius * (maxScale * 0.5));

        return (globalSphere.isOnOrForwardPlane(camFrustum[0]) &&
            globalSphere.isOnOrForwardPlane(camFrustum[1]) &&
            globalSphere.isOnOrForwardPlane(camFrustum[2]) &&
            globalSphere.isOnOrForwardPlane(camFrustum[3]) &&
            globalSphere.isOnOrForwardPlane(camFrustum[4]) &&
            globalSphere.isOnOrForwardPlane(camFrustum[5]));
    }

    public isOnOrForwardPlane(plane: vec4) {
        return vec3.dot(vec3.fromValues(plane[0], plane[1], plane[2]), this.center) - plane[3] > -this.radius;
    }
}