import * as THREE from 'three';
import { HoverGlitchMaterial } from '../glitch/HoverGlitchImage';
import { CarouselItemData } from './WebGLCarousel';

export class CarouselScene {
    public group: THREE.Group;
    public items: THREE.Mesh[] = [];
    private radius: number = 4;

    constructor() {
        this.group = new THREE.Group();
    }

    createItems(data: CarouselItemData[]) {
        // Clear existing
        this.items.forEach(mesh => {
            this.group.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
        this.items = [];

        const geometry = new THREE.PlaneGeometry(2, 1.4);
        const step = (Math.PI * 2) / data.length;

        data.forEach((item, i) => {
            const texture = item.texture || this.createPlaceholderTexture(item.label || `Item ${i}`);
            const material = new HoverGlitchMaterial(texture);
            const mesh = new THREE.Mesh(geometry, material);

            mesh.userData = { id: item.id, index: i, initialAngle: i * step };

            this.group.add(mesh);
            this.items.push(mesh);
        });
    }

    update(currentAngle: number, hoveredItem: THREE.Mesh | null) {
        this.items.forEach((mesh) => {
            const material = mesh.material as HoverGlitchMaterial;

            // Calculate angle
            let theta = mesh.userData.initialAngle + currentAngle;

            // Position
            mesh.position.x = this.radius * Math.sin(theta);
            mesh.position.z = this.radius * Math.cos(theta) - this.radius;
            mesh.rotation.y = theta;

            // Hover State
            const isHovered = mesh === hoveredItem;
            const targetHover = isHovered ? 1.0 : 0.0;
            material.hoverState += (targetHover - material.hoverState) * 0.1;

            // Simple loop time
            material.time += 0.01;
        });
    }

    private createPlaceholderTexture(text: string): THREE.Texture {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, 512, 360);
            ctx.strokeStyle = '#B11226';
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, 512, 360);

            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 40px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 256, 180);
        }
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    dispose() {
        this.items.forEach(mesh => {
            this.group.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
        });
    }
}
