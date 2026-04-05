export class DepthCompressionController {
    private compressionValue: number = 0;
    private isAnimating: boolean = false;
    private startTime: number = 0;
    private duration: number = 800; // ms

    // Callbacks to update UI/Shader
    private onUpdate: (val: number) => void;

    constructor(onUpdate: (val: number) => void) {
        this.onUpdate = onUpdate;
    }

    public trigger() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.startTime = performance.now();
        this.animate();
    }

    private animate = () => {
        if (!this.isAnimating) return;

        const now = performance.now();
        const elapsed = now - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1.0);

        // Timeline:
        // 0-300ms: 0 -> 1 (Ease Out)
        // 300-600ms: Hold at 1
        // 600-800ms: 1 -> 0 (Ease In)

        let val = 0;

        if (elapsed < 300) {
            const p = elapsed / 300;
            // Ease out cubic
            val = 1 - Math.pow(1 - p, 3);
        } else if (elapsed < 600) {
            val = 1;
        } else {
            const p = (elapsed - 600) / 200;
            // Ease in cubic (reverse)
            val = 1 - (p * p * p);
        }

        this.compressionValue = val;
        this.onUpdate(this.compressionValue);

        if (progress < 1.0) {
            requestAnimationFrame(this.animate);
        } else {
            this.isAnimating = false;
            this.compressionValue = 0;
            this.onUpdate(0);
        }
    }
}
