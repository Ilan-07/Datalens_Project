import { CarouselPhysics } from "./CarouselPhysics";

export class SnapController {
    private physics: CarouselPhysics;
    private itemStep: number; // Angle between items (e.g., Math.PI / 4)
    private snapThreshold: number = 0.005; // Velocity below which snapping starts
    private snapStrength: number = 0.1; // Spring force

    constructor(physics: CarouselPhysics, totalItems: number) {
        this.physics = physics;
        this.itemStep = (Math.PI * 2) / totalItems;
    }

    update(totalItems: number) {
        this.itemStep = (Math.PI * 2) / totalItems;

        if (!this.physics.isDragging && Math.abs(this.physics.velocity) < this.snapThreshold) {
            // Find nearest slot
            // We want to snap currentAngle to a multiple of itemStep
            // currentAngle = 0 is item 0.

            const rawIndex = this.physics.currentAngle / this.itemStep;
            const targetIndex = Math.round(rawIndex);
            const targetAngle = targetIndex * this.itemStep;

            // Apply simple P-controller (spring)
            const diff = targetAngle - this.physics.currentAngle;

            this.physics.currentAngle += diff * this.snapStrength;
            this.physics.velocity = 0; // Kill velocity while snapping
        }
    }

    getNearestIndex(): number {
        const rawIndex = this.physics.currentAngle / this.itemStep;
        return Math.round(rawIndex);
    }
}
