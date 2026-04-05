
import * as THREE from 'three';
import { CarouselPhysics } from './CarouselPhysics';
import { SnapController } from './SnapController';
import { CarouselScene } from './CarouselScene';
import { ImmersiveScrollController } from './ImmersiveScrollController';

export interface CarouselItemData {
    id: string;
    texture?: THREE.Texture;
    label?: string;
    description?: string;
}


export class WebGLCarousel {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;

    private carouselScene: CarouselScene;
    private physics: CarouselPhysics;
    private snap: SnapController;
    private scrollController: ImmersiveScrollController;

    private onClick?: (id: string) => void;

    private rafId: number | null = null;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private hoveredItem: THREE.Mesh | null = null;
    private width: number;
    private height: number;

    constructor(container: HTMLElement, data: CarouselItemData[], onClick?: (id: string) => void) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.onClick = onClick;

        // 1. Setup Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.z = 6;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // 2. Scene Logic
        this.carouselScene = new CarouselScene();
        this.scene.add(this.carouselScene.group);
        this.carouselScene.createItems(data);

        // 3. Physics
        this.physics = new CarouselPhysics();
        this.snap = new SnapController(this.physics, data.length);
        this.scrollController = new ImmersiveScrollController(this.physics);

        // 4. Interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.setupEvents();

        // 5. Start Loop
        this.animate();
    }

    private setupEvents() {
        let isMouseDown = false;
        let startX = 0;
        let startY = 0;
        let startTime = 0;

        // Mouse Handlers
        const onStart = (x: number, y: number) => {
            isMouseDown = true;
            startX = x;
            startY = y;
            startTime = performance.now();
            this.physics.startDrag(x);
            this.container.style.cursor = 'grabbing';
        };

        const onMove = (x: number, y: number) => {
            if (isMouseDown) {
                this.physics.drag(x);
            }
            this.mouse.x = (x / this.width) * 2 - 1;
            this.mouse.y = -(y / this.height) * 2 + 1;
        };

        const onEnd = (x: number, y: number) => {
            isMouseDown = false;
            this.physics.endDrag();
            this.container.style.cursor = 'grab';

            // Click Detection
            const dist = Math.abs(x - startX) + Math.abs(y - startY);
            const time = performance.now() - startTime;

            if (dist < 5 && time < 300) {
                this.handleClick();
            }
        };

        this.container.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            // Raycast update
            onMove(e.clientX - rect.left, e.clientY - rect.top);
        });
        window.addEventListener('mouseup', (e) => onEnd(e.clientX, e.clientY));
    }

    private handleClick() {
        if (this.hoveredItem && this.onClick) {
            this.onClick(this.hoveredItem.userData.id);
        }
    }

    public setMode(mode: 'carousel' | 'immersive') {
        this.scrollController.setMode(mode);
        if (mode === 'immersive') {
            this.container.style.pointerEvents = 'none'; // Disable drag
        } else {
            this.container.style.pointerEvents = 'auto';
        }
    }

    private animate = () => {
        this.rafId = requestAnimationFrame(this.animate);

        // Update Scroll
        this.scrollController.update();

        // Update Physics (only if not immersive? ScrollController overrides angle anyway)
        if (!this.scrollController.isActive) {
            this.physics.update();
            this.snap.update(this.carouselScene.items.length);
        }


        // Update Scene Positions
        this.carouselScene.update(this.physics.currentAngle, this.hoveredItem);

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.carouselScene.items);

        if (intersects.length > 0) {
            this.hoveredItem = intersects[0].object as THREE.Mesh;
            this.container.style.cursor = 'pointer';
        } else {
            this.hoveredItem = null;
            if (!this.physics.isDragging) this.container.style.cursor = 'grab';
        }

        this.renderer.render(this.scene, this.camera);
    };

    public dispose() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.renderer.dispose();
        this.carouselScene.dispose();
        this.container.innerHTML = ''; // Remove canvas
    }
}
