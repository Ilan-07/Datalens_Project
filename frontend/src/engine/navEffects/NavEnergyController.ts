import { DepthCompressionController } from './DepthCompressionController';

type EffectCallback = (type: 'ENERGY' | 'GLITCH' | 'RIPPLE' | 'DEPTH', value?: number) => void;

export class NavEnergyController {
    private depthController: DepthCompressionController;
    private listeners: EffectCallback[] = [];

    // State tracking
    public isCollapsed: boolean = false;
    private lastScrollY: number = 0;
    private collapseThreshold: number = 100;

    constructor() {
        this.depthController = new DepthCompressionController((val) => {
            this.notify('DEPTH', val);
        });
    }

    public addListener(cb: EffectCallback) {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter(l => l !== cb);
        };
    }

    private notify(type: 'ENERGY' | 'GLITCH' | 'RIPPLE' | 'DEPTH', value?: number) {
        this.listeners.forEach(cb => cb(type, value));
    }

    public handleScroll(scrollY: number) {
        // Debounce/Throttling handled by caller or simple logic here

        // Trigger collapse
        if (!this.isCollapsed && scrollY > this.collapseThreshold) {
            this.isCollapsed = true;
            this.triggerTransition();
        }
        // Trigger expand
        else if (this.isCollapsed && scrollY < this.collapseThreshold) {
            this.isCollapsed = false;
            // Optional: Trigger reverse transition or just reset
            this.triggerTransition();
        }

        this.lastScrollY = scrollY;
    }

    public triggerTransition() {
        // Synchronized Sequence
        // 1. Energy Wave
        this.notify('ENERGY');

        // 2. Glitch Spike
        this.notify('GLITCH');

        // 3. Ripple
        this.notify('RIPPLE');

        // 4. Depth Compression (0-800ms)
        this.depthController.trigger();
    }
}

export const navEnergyController = new NavEnergyController();
