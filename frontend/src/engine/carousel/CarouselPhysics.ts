export class CarouselPhysics {
    public velocity: number = 0;
    public friction: number = 0.95;
    public isDragging: boolean = false;
    public lastDragX: number = 0;
    public currentAngle: number = 0;

    constructor(initialAngle: number = 0) {
        this.currentAngle = initialAngle;
    }

    startDrag(x: number) {
        this.isDragging = true;
        this.lastDragX = x;
        this.velocity = 0;
    }

    drag(x: number, sensitivity: number = 0.005) {
        if (!this.isDragging) return;
        const delta = x - this.lastDragX;
        this.currentAngle -= delta * sensitivity;
        this.velocity = -delta * sensitivity; // Instant velocity for throw
        this.lastDragX = x;
    }

    endDrag() {
        this.isDragging = false;
    }

    update() {
        if (!this.isDragging) {
            this.currentAngle += this.velocity;
            this.velocity *= this.friction;

            // Stop tiny floating point drift
            if (Math.abs(this.velocity) < 0.0001) {
                this.velocity = 0;
            }
        }
    }
}
