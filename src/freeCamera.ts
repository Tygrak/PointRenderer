import { vec3, mat4 } from 'gl-matrix';


export class FreeCamera {
    pitch = 0;
    yaw = Math.PI;
    lastMousePosX = 0;
    lastMousePosY = 0;
    mouseDown = false;
    used = false;
    position = vec3.fromValues(0, 0, -10);
    forward = vec3.fromValues(0, 0, 1);
    up = vec3.fromValues(0, 1, 0);

    constructor () {
    }

    private OnMouseDown(e: MouseEvent, camera: FreeCamera) {
        camera.mouseDown = true;
    }
    private OnMouseUp(e: MouseEvent, camera: FreeCamera) {
        camera.mouseDown = false;
    }
    private OnMouseMove(e: MouseEvent, camera: FreeCamera) {
        if (camera.used && camera.mouseDown) {
            let dirX = e.pageX-camera.lastMousePosX;
            let dirY = e.pageY-camera.lastMousePosY;
            camera.pitch += 0.005*dirY;
            camera.pitch = Math.max(-Math.PI/2+0.1, Math.min(Math.PI/2-0.1, camera.pitch));
            camera.yaw -= 0.005*dirX;
            camera.CalculateRotation();
        }
        camera.lastMousePosX = e.pageX;
        camera.lastMousePosY = e.pageY;
    }
    private OnKeypress(keyEvent: KeyboardEvent, camera: FreeCamera) {
        if (!camera.used) {
            return;
        }
        if (keyEvent.code == "KeyW") {
            camera.position = vec3.add(vec3.create(), camera.position, camera.forward);
        } 
        if (keyEvent.code == "KeyS") {
            camera.position = vec3.subtract(vec3.create(), camera.position, camera.forward);
        } 
        if (keyEvent.code == "KeyA") {
            let right = vec3.cross(vec3.create(), camera.forward, camera.up);
            camera.position = vec3.subtract(vec3.create(), camera.position, right);
        } 
        if (keyEvent.code == "KeyD") {
            let right = vec3.cross(vec3.create(), camera.forward, camera.up);
            camera.position = vec3.add(vec3.create(), camera.position, right);
        } 
        if (keyEvent.shiftKey && keyEvent.code == "KeyE") {
            camera.yaw -= 0.05;
            camera.CalculateRotation();
        } 
        if (keyEvent.shiftKey && keyEvent.code == "KeyQ") {
            camera.yaw += 0.05;
            camera.CalculateRotation();
        } 
        if (!keyEvent.shiftKey && keyEvent.code == "KeyE") {
            camera.position = vec3.add(vec3.create(), camera.position, camera.up);
        } 
        if (!keyEvent.shiftKey && keyEvent.code == "KeyQ") {
            camera.position = vec3.subtract(vec3.create(), camera.position, camera.up);
        } 
    }
    public CalculateRotation() {
        this.forward = vec3.rotateX(vec3.create(), vec3.fromValues(0, 0, 1), vec3.create(), this.pitch);
        this.forward = vec3.rotateY(this.forward, this.forward, vec3.create(), this.yaw);
    }

    public Initialize() {
        document.addEventListener("mousedown", (e) => {this.OnMouseDown(e, this)});
        document.addEventListener("mouseup", (e) => {this.OnMouseUp(e, this)});
        document.addEventListener("mousemove", (e) => {this.OnMouseMove(e, this)});
        document.addEventListener("keypress", (e) => {this.OnKeypress(e, this)});
    }
}