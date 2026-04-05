/**
 * DepthParticleSystem
 * ====================
 * Canvas-based particles floating inside the folder cavity.
 * Slow vertical drift, soft fade edges, lighting-reactive.
 */

import React, { useRef, useEffect, useCallback } from "react";

interface DepthParticleSystemProps {
    opacity: number;     // 0–1
    brightness: number;  // 0–1, from lighting adapter
    active: boolean;
}

const PARTICLE_COUNT = 18;

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
}

function spawnParticle(w: number, h: number): Particle {
    return {
        x: 0.2 * w + Math.random() * 0.6 * w,
        y: h * 0.5 + Math.random() * h * 0.4,
        vx: (Math.random() - 0.5) * 8,
        vy: -(5 + Math.random() * 15),
        size: 1 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.5,
        life: 0,
        maxLife: 3 + Math.random() * 4,
    };
}

export const DepthParticleSystem: React.FC<DepthParticleSystemProps> = ({
    opacity,
    brightness,
    active,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const draw = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const dt = Math.min((time - (lastTimeRef.current || time)) / 1000, 0.05);
        lastTimeRef.current = time;

        ctx.clearRect(0, 0, w, h);

        if (opacity < 0.01) {
            rafRef.current = requestAnimationFrame(draw);
            return;
        }

        let particles = particlesRef.current;

        // Spawn new particles
        while (particles.length < PARTICLE_COUNT) {
            particles.push(spawnParticle(w, h));
        }

        // Update & draw
        const alive: Particle[] = [];
        for (const p of particles) {
            p.life += dt;
            if (p.life > p.maxLife) continue;

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            const lifeRatio = p.life / p.maxLife;
            // Fade in first 20%, fade out last 30%
            let fadeMult = 1;
            if (lifeRatio < 0.2) fadeMult = lifeRatio / 0.2;
            else if (lifeRatio > 0.7) fadeMult = 1 - (lifeRatio - 0.7) / 0.3;

            const a = p.alpha * fadeMult * opacity * brightness;

            const r = Math.round(220 + brightness * 35);
            const g = Math.round(180 + brightness * 40);
            const b = Math.round(160 + brightness * 30);

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
            ctx.fill();

            // Soft glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            grad.addColorStop(0, `rgba(${r},${g},${b},${a * 0.3})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fill();

            alive.push(p);
        }

        particlesRef.current = alive;
        rafRef.current = requestAnimationFrame(draw);
    }, [opacity, brightness]);

    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
        }
        particlesRef.current = [];
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(rafRef.current);
            particlesRef.current = [];
        };
    }, [active, draw]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{
                width: "100%",
                height: "100%",
                opacity: Math.min(opacity, 1),
                zIndex: 4,
            }}
        />
    );
};
