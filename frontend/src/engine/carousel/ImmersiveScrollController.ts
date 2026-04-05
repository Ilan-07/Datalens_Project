import { CarouselPhysics } from "./CarouselPhysics";

export class ImmersiveScrollController {
    private physics: CarouselPhysics;
    public isActive: boolean = false;

    private sensitivity: number = 0.002;
    private targetScrollY: number = 0;
    private currentScrollY: number = 0;

    constructor(physics: CarouselPhysics) {
        this.physics = physics;
        this.setupEvents();
    }

    private setupEvents() {
        window.addEventListener('scroll', () => {
            if (this.isActive) {
                this.targetScrollY = window.scrollY;
            }
        });
    }

    public setMode(mode: 'carousel' | 'immersive') {
        this.isActive = mode === 'immersive';
    }

    public update() {
        if (!this.isActive) return;

        // Smooth scroll interpolation
        this.currentScrollY += (this.targetScrollY - this.currentScrollY) * 0.1;

        // Map scroll Y to angle
        // e.g. 1000px = 2PI
        const angle = this.currentScrollY * this.sensitivity;

        // Override physics angle
        // But we want to allow drag? User said "Drag disabled" in immersive mode.
        // So we purely set angle.

        this.physics.currentAngle = -angle;
        this.physics.velocity = 0;
    }
}
