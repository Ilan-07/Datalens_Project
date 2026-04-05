import * as THREE from 'three';
import { vertexShader, fragmentShader } from '../carousel/CarouselShaders';

export class HoverGlitchMaterial extends THREE.ShaderMaterial {
    constructor(texture: THREE.Texture) {
        super({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTexture: { value: texture },
                uTime: { value: 0 },
                uHoverState: { value: 0 },
                uGlitchIntensity: { value: 0.5 },
                uBlurStrength: { value: 0.0 },
                uResolution: { value: new THREE.Vector2(1, 1) },
                uCornerRadius: { value: 0.05 }
            },
            transparent: true,
        });
    }

    get blurStrength(): number {
        return this.uniforms.uBlurStrength.value;
    }
    set blurStrength(v: number) {
        this.uniforms.uBlurStrength.value = v;
    }

    get time(): number {
        return this.uniforms.uTime.value;
    }
    set time(v: number) {
        this.uniforms.uTime.value = v;
    }

    get hoverState(): number {
        return this.uniforms.uHoverState.value;
    }
    set hoverState(v: number) {
        this.uniforms.uHoverState.value = v;
    }

    get texture(): THREE.Texture {
        return this.uniforms.uTexture.value;
    }
    set texture(v: THREE.Texture) {
        this.uniforms.uTexture.value = v;
    }
}
