/**
 * LightRig
 * ========
 * Creates Three.js light objects and applies them to any scene.
 * Reads from GlobalLighting singleton and updates lights each frame.
 */

import * as THREE from 'three';
import { globalLighting, type LightingState } from './GlobalLighting';

export class LightRig {
    private ambient: THREE.AmbientLight;
    private rim: THREE.DirectionalLight;
    private pointGlow: THREE.PointLight;
    private fog: THREE.FogExp2;
    private scene: THREE.Scene | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor() {
        const state = globalLighting.getState();

        this.ambient = new THREE.AmbientLight(
            new THREE.Color(...state.ambientColor),
            state.ambientIntensity
        );

        this.rim = new THREE.DirectionalLight(
            new THREE.Color(...state.rimColor),
            state.rimIntensity
        );
        this.rim.position.set(...state.rimDirection);

        this.pointGlow = new THREE.PointLight(
            new THREE.Color(...state.pointGlowColor),
            state.pointGlowIntensity,
            10,
            2
        );
        this.pointGlow.position.set(...state.pointGlowPosition);

        this.fog = new THREE.FogExp2(
            new THREE.Color(...state.fogColor).getHex(),
            state.fogDensity
        );
    }

    /** Attach lights to a Three.js scene */
    attach(scene: THREE.Scene) {
        this.scene = scene;
        scene.add(this.ambient);
        scene.add(this.rim);
        scene.add(this.pointGlow);
        scene.fog = this.fog;

        // Subscribe to lighting changes
        this.unsubscribe = globalLighting.subscribe((state) => {
            this.applyState(state);
        });
    }

    /** Apply a lighting state snapshot to all lights */
    private applyState(state: LightingState) {
        this.ambient.color.setRGB(...state.ambientColor);
        this.ambient.intensity = state.ambientIntensity;

        this.rim.color.setRGB(...state.rimColor);
        this.rim.intensity = state.rimIntensity;
        this.rim.position.set(...state.rimDirection);

        this.pointGlow.color.setRGB(...state.pointGlowColor);
        this.pointGlow.intensity = state.pointGlowIntensity;
        this.pointGlow.position.set(...state.pointGlowPosition);

        if (this.fog) {
            this.fog.color.setRGB(...state.fogColor);
            this.fog.density = state.fogDensity;
        }
    }

    /** Configure renderer tone mapping */
    applyToneMapping(renderer: THREE.WebGLRenderer) {
        const state = globalLighting.getState();
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = state.hdrExposure;

        // Subscribe to exposure changes
        globalLighting.subscribe((s) => {
            renderer.toneMappingExposure = s.hdrExposure;
        });
    }

    /** Detach lights and cleanup */
    detach() {
        if (this.scene) {
            this.scene.remove(this.ambient);
            this.scene.remove(this.rim);
            this.scene.remove(this.pointGlow);
            this.scene.fog = null;
            this.scene = null;
        }
        this.unsubscribe?.();
    }

    dispose() {
        this.detach();
        this.ambient.dispose();
        this.rim.dispose();
        this.pointGlow.dispose();
    }
}
