import React, { useEffect, useRef } from 'react';
import { navEnergyController } from '@/engine/navEffects/NavEnergyController';
import * as THREE from 'three';

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform float uCompression;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5);
    float dist = length(uv - center);
    
    float vignette = smoothstep(1.0, 0.2, dist * (1.0 + uCompression));

    float alpha = 0.0;

    float rDist = length(uv - center - vec2(uCompression * 0.01, 0.0));
    float rAlpha = smoothstep(0.4, 0.5, rDist) * uCompression * 0.3;

    float bDist = length(uv - center + vec2(uCompression * 0.01, 0.0));
    float bAlpha = smoothstep(0.4, 0.5, bDist) * uCompression * 0.3;

    vec3 color = vec3(0.0);
    color.r += rAlpha;
    color.b += bAlpha;

    alpha = (rAlpha + bAlpha) * 0.5 + (1.0 - vignette) * uCompression * 0.2;

    gl_FragColor = vec4(color, alpha);
}
`;

export const SceneDepthWrapper = ({ children }: { children: React.ReactNode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        canvasRef.current.appendChild(renderer.domElement);

        const uniforms = {
            uTime: { value: 0 },
            uCompression: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        };

        const geo = new THREE.PlaneGeometry(2, 2);
        const mat = new THREE.ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            uniforms,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        const cleanupListener = navEnergyController.addListener((type, value) => {
            if (type === 'DEPTH' && typeof value === 'number') {
                uniforms.uCompression.value = value;

                if (containerRef.current) {
                    const p = 1000 - (value * 150);
                    const tz = -(value * 20);
                    const rx = value * 0.3;
                    const s = 1.0 - (value * 0.015);

                    containerRef.current.style.perspective = `${p}px`;
                    containerRef.current.style.transform = `translate3d(0,0,${tz}px) rotateX(${rx}deg) scale(${s})`;
                }
            }
        });

        let rafId: number;
        const animate = () => {
            uniforms.uTime.value += 0.05;
            renderer.render(scene, camera);
            rafId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cleanupListener();
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(rafId);
            renderer.dispose();
            if (canvasRef.current) canvasRef.current.innerHTML = '';
        };
    }, []);

    return (
        <>
            <div ref={canvasRef} className="fixed inset-0 z-[80] pointer-events-none" />

            <div
                ref={containerRef}
                className="w-full min-h-screen origin-center will-change-transform"
                style={{
                    perspective: '1000px',
                    transformStyle: 'preserve-3d'
                }}
            >
                {children}
            </div>
        </>
    );
};
