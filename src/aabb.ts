import { vec3, vec4, mat4 } from "gl-matrix";

export class AABB {
    min: vec3;
    max: vec3;
    center: vec3;
    extents: vec3;

    constructor (min: vec3, max: vec3) {
        this.min = min;
        this.max = max;
        this.center = vec3.add(vec3.create(), min, max);
        this.center = vec3.scale(this.center, this.center, 0.5);
        this.extents = vec3.subtract(vec3.create(), max, this.center);
    }

    public ShouldRenderForFrustum(camFrustumPlanes: vec4[], transform: mat4) {
        return this.TransformAABB(transform).IsPartlyInFrustum(camFrustumPlanes);
    }

    public TransformAABB(transform: mat4) {
        let corners = [
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.min[1], this.min[2]), transform),
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.min[1], this.min[2]), transform),
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.max[1], this.min[2]), transform),
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.max[1], this.min[2]), transform),
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.min[1], this.max[2]), transform),
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.min[1], this.max[2]), transform),
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.min[0], this.max[1], this.max[2]), transform),
            vec3.transformMat4(vec3.create(), vec3.fromValues(this.max[0], this.max[1], this.max[2]), transform),
        ];
        let boundsMax = vec3.fromValues(-1000000, -1000000, -1000000);
        let boundsMin = vec3.fromValues(1000000, 1000000, 1000000);
        for (let i = 0; i < corners.length; i++) {
            boundsMax = [Math.max(boundsMax[0], corners[i][0]), Math.max(boundsMax[1], corners[i][1]), Math.max(boundsMax[2], corners[i][2])]
            boundsMin = [Math.min(boundsMin[0], corners[i][0]), Math.min(boundsMin[1], corners[i][1]), Math.min(boundsMin[2], corners[i][2])]
        }
        return new AABB(boundsMin, boundsMax);
    }

    public IsPartlyInFrustum(camFrustumPlanes: vec4[]) {
        for (let i = 0; i < camFrustumPlanes.length; i++) {
            const plane = camFrustumPlanes[i];
            if ((vec4.dot(plane, vec4.fromValues(this.min[0], this.min[1], this.min[2], 1.0)) < 0.0) &&
                (vec4.dot(plane, vec4.fromValues(this.max[0], this.min[1], this.min[2], 1.0)) < 0.0) &&
                (vec4.dot(plane, vec4.fromValues(this.min[0], this.max[1], this.min[2], 1.0)) < 0.0) &&
                (vec4.dot(plane, vec4.fromValues(this.max[0], this.max[1], this.min[2], 1.0)) < 0.0) &&
                (vec4.dot(plane, vec4.fromValues(this.min[0], this.min[1], this.max[2], 1.0)) < 0.0) &&
                (vec4.dot(plane, vec4.fromValues(this.max[0], this.min[1], this.max[2], 1.0)) < 0.0) &&
                (vec4.dot(plane, vec4.fromValues(this.min[0], this.max[1], this.max[2], 1.0)) < 0.0) &&
                (vec4.dot(plane, vec4.fromValues(this.max[0], this.max[1], this.max[2], 1.0)) < 0.0)) {
                return false;
            }
        }
        return true;
    }
}