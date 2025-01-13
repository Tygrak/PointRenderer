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

    public InFrustum(camFrustum: vec3[], transform: mat4) {
        //Get global scale thanks to our transform
        let globalCenter = vec4.transformMat4(vec4.create(), vec4.fromValues(this.center[0], this.center[1], this.center[2], 1), transform);
    
        //todo
        /*// Scaled orientation
        const glm::vec3 right = transform.getRight() * extents.x;
        const glm::vec3 up = transform.getUp() * extents.y;
        const glm::vec3 forward = transform.getForward() * extents.z;
    
        const float newIi = std::abs(glm::dot(glm::vec3{ 1.f, 0.f, 0.f }, right)) +
            std::abs(glm::dot(glm::vec3{ 1.f, 0.f, 0.f }, up)) +
            std::abs(glm::dot(glm::vec3{ 1.f, 0.f, 0.f }, forward));
    
        const float newIj = std::abs(glm::dot(glm::vec3{ 0.f, 1.f, 0.f }, right)) +
            std::abs(glm::dot(glm::vec3{ 0.f, 1.f, 0.f }, up)) +
            std::abs(glm::dot(glm::vec3{ 0.f, 1.f, 0.f }, forward));
    
        const float newIk = std::abs(glm::dot(glm::vec3{ 0.f, 0.f, 1.f }, right)) +
            std::abs(glm::dot(glm::vec3{ 0.f, 0.f, 1.f }, up)) +
            std::abs(glm::dot(glm::vec3{ 0.f, 0.f, 1.f }, forward));
    
        //We not need to divise scale because it's based on the half extention of the AABB
        const AABB globalAABB(globalCenter, newIi, newIj, newIk);
    
        return (globalAABB.isOnOrForwardPlane(camFrustum.leftFace) &&
            globalAABB.isOnOrForwardPlane(camFrustum.rightFace) &&
            globalAABB.isOnOrForwardPlane(camFrustum.topFace) &&
            globalAABB.isOnOrForwardPlane(camFrustum.bottomFace) &&
            globalAABB.isOnOrForwardPlane(camFrustum.nearFace) &&
            globalAABB.isOnOrForwardPlane(camFrustum.farFace));*/
    };
}