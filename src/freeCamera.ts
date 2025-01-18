import { vec3, mat4 } from 'gl-matrix';


export class FreeCamera {
    pitch = 0;
    yaw = 0;
    lastMousePosX = 0;
    lastMousePosY = 0;
    mouseDown = false;
    used = false;
    position = vec3.fromValues(0, 1, -10);
    forward = vec3.fromValues(0, 0, 1);
    up = vec3.fromValues(0, 1, 0);

    forwardButtonDown = false;
    leftButtonDown = false;
    rightButtonDown = false;
    backButtonDown = false;
    upButtonDown = false;
    downButtonDown = false;

    speed = 5;

    constructor () {
    }

    private OnMouseDown(e: MouseEvent, camera: FreeCamera) {
        camera.mouseDown = true;
    }
    private OnMouseUp(e: MouseEvent, camera: FreeCamera) {
        camera.mouseDown = false;
    }
    private OnMouseWheel(e: WheelEvent, camera: FreeCamera) {
        if (!camera.used) {
            return;
        }
        this.speed = Math.max(this.speed-e.deltaY*0.01, 0.01);
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

    public Update(deltaTime: number) {
        if (this.forwardButtonDown) {
            this.position = vec3.add(vec3.create(), this.position, vec3.scale(vec3.create(), this.forward, this.speed*deltaTime));
        } 
        if (this.backButtonDown) {
            this.position = vec3.subtract(vec3.create(), this.position, vec3.scale(vec3.create(), this.forward, this.speed*deltaTime));
        } 
        if (this.leftButtonDown) {
            let right = vec3.cross(vec3.create(), this.forward, this.up);
            this.position = vec3.subtract(vec3.create(), this.position, vec3.scale(vec3.create(), right, this.speed*deltaTime));
        } 
        if (this.rightButtonDown) {
            let right = vec3.cross(vec3.create(), this.forward, this.up);
            this.position = vec3.add(vec3.create(), this.position, vec3.scale(vec3.create(), right, this.speed*deltaTime));
        } 
        if (this.upButtonDown) {
            this.position = vec3.add(vec3.create(), this.position, vec3.scale(vec3.create(), this.up, this.speed*deltaTime));
        } 
        if (this.downButtonDown) {
            this.position = vec3.subtract(vec3.create(), this.position, vec3.scale(vec3.create(), this.up, this.speed*deltaTime));
        }
        this.CalculateRotation();
    }

    private OnKeyDown(keyEvent: KeyboardEvent, camera: FreeCamera) {
        if (!camera.used) {
            return;
        }
        if (keyEvent.code == "KeyW") {
            this.forwardButtonDown = true;
            camera.position = vec3.add(vec3.create(), camera.position, vec3.scale(vec3.create(), camera.forward, this.speed*0.01));
        } 
        if (keyEvent.code == "KeyS") {
            this.backButtonDown = true;
            camera.position = vec3.subtract(vec3.create(), camera.position, vec3.scale(vec3.create(), camera.forward, this.speed*0.01));
        } 
        if (keyEvent.code == "KeyA") {
            this.leftButtonDown = true;
            let right = vec3.cross(vec3.create(), camera.forward, camera.up);
            camera.position = vec3.subtract(vec3.create(), camera.position, vec3.scale(vec3.create(), right, this.speed*0.01));
        } 
        if (keyEvent.code == "KeyD") {
            this.rightButtonDown = true;
            let right = vec3.cross(vec3.create(), camera.forward, camera.up);
            camera.position = vec3.add(vec3.create(), camera.position, vec3.scale(vec3.create(), right, this.speed*0.01));
        } 
        if (keyEvent.shiftKey && keyEvent.code == "KeyE") {
            camera.yaw -= 0.05*this.speed;
            camera.CalculateRotation();
        } 
        if (keyEvent.shiftKey && keyEvent.code == "KeyQ") {
            camera.yaw += 0.05*this.speed;
            camera.CalculateRotation();
        } 
        if (!keyEvent.shiftKey && keyEvent.code == "KeyE") {
            this.upButtonDown = true;
            camera.position = vec3.add(vec3.create(), camera.position, vec3.scale(vec3.create(), camera.up, this.speed*0.01));
        } 
        if (!keyEvent.shiftKey && keyEvent.code == "KeyQ") {
            this.downButtonDown = true;
            camera.position = vec3.subtract(vec3.create(), camera.position, vec3.scale(vec3.create(), camera.up, this.speed*0.01));
        } 
    }

    private OnKeyUp(keyEvent: KeyboardEvent, camera: FreeCamera) {
        if (!camera.used) {
            return;
        }
        if (keyEvent.code == "KeyW") {
            this.forwardButtonDown = false;
        } 
        if (keyEvent.code == "KeyS") {
            this.backButtonDown = false;
        } 
        if (keyEvent.code == "KeyA") {
            this.leftButtonDown = false;
        } 
        if (keyEvent.code == "KeyD") {
            this.rightButtonDown = false;
        }
        if (!keyEvent.shiftKey && keyEvent.code == "KeyE") {
            this.upButtonDown = false;
        } 
        if (!keyEvent.shiftKey && keyEvent.code == "KeyQ") {
            this.downButtonDown = false;
        } 
    }

    public CalculateRotation() {
        this.forward = vec3.rotateX(vec3.create(), vec3.fromValues(0, 0, 1), vec3.create(), this.pitch);
        this.forward = vec3.rotateY(this.forward, this.forward, vec3.create(), this.yaw);
        this.forward = vec3.normalize(this.forward, this.forward);
    }

    public Initialize(canvas: HTMLCanvasElement) {
        canvas.addEventListener("mousedown", (e) => {this.OnMouseDown(e, this)});
        document.addEventListener("mouseup", (e) => {this.OnMouseUp(e, this)});
        canvas.addEventListener("wheel", (e) => {this.OnMouseWheel(e, this)});
        document.addEventListener("mousemove", (e) => {this.OnMouseMove(e, this)});
        document.addEventListener("keydown", (e) => {this.OnKeyDown(e, this)});
        document.addEventListener("keyup", (e) => {this.OnKeyUp(e, this)});
    }
}