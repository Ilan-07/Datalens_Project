/**
 * FloatingParticles — Reusable Canvas Particle System
 * ====================================================
 * Atmospheric drifting particles. Cyan / violet / white.
 * Performance-optimized with RAF, auto-reduces on low-perf devices.
 */

import React, { useRef, useEffect, useCallback } from "react";

interface FloatingParticlesProps {
    /** Desktop count (default 80) */
    count?: number;
    /** Mobile count (default 40) */
    mobileCount?: number;
    className?: string;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    opacity: number;
    baseOpacity: number;
    phase: number;
}

const COLORS = [
    "0, 240, 255",   // soft cyan
    "140, 100, 255",  // dim violet
    "220, 220, 230",  // neutral white
];

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
    count = 80,
    mobileCount = 40,
    className,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    const initParticles = useCallback((w: number, h: number, n: number) => {
        const particles: Particle[] = [];
        for (let i = 0; i < n; i++) {
            const colorIdx = Math.floor(Math.random() * COLORS.length);
            const baseOpacity = 0.15 + Math.random() * 0.2;
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: 2 + Math.random() * 3,
                color: COLORS[colorIdx],
                opacity: baseOpacity,
                baseOpacity,
                phase: Math.random() * Math.PI * 2,
            });
        }
        return particles;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const isMobile = typeof window !== "undefined" && (
            "ontouchstart" in window || window.innerWidth < 768
        );
        const particleCount = isMobile ? mobileCount : count;

        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (!rect) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        resize();
        const rect = canvas.parentElement?.getBoundingClientRect();
        const w = rect?.width || 800;
        const h = rect?.height || 600;
        particlesRef.current = initParticles(w, h, particleCount);

        let time = 0;
        const draw = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (!rect) { rafRef.current = requestAnimationFrame(draw); return; }

            const cw = rect.width;
            const ch = rect.height;

            ctx.clearRect(0, 0, cw, ch);
            time += 0.005;

            for (const p of particlesRef.current) {
                // Gentle vector drift
                p.vx += (Math.random() - 0.5) * 0.01;
                p.vy += (Math.random() - 0.5) * 0.01;

                // Dampen velocity
                p.vx *= 0.998;
                p.vy *= 0.998;

                // Clamp speed
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed > 0.5) {
                    p.vx = (p.vx / speed) * 0.5;
                    p.vy = (p.vy / speed) * 0.5;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Soft edge bounce
                if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) * 0.5; }
                if (p.x > cw) { p.x = cw; p.vx = -Math.abs(p.vx) * 0.5; }
                if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) * 0.5; }
                if (p.y > ch) { p.y = ch; p.vy = -Math.abs(p.vy) * 0.5; }

                // Opacity oscillation
                p.opacity = p.baseOpacity + Math.sin(time * 2 + p.phase) * 0.08;

                // Draw with glow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
                ctx.fill();

                // Subtle glow ring (skip on mobile)
                if (!isMobile) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.15})`;
                    ctx.fill();
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        rafRef.current = requestAnimationFrame(draw);

        const resizeObserver = new ResizeObserver(() => resize());
        if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            resizeObserver.disconnect();
        };
    }, [count, mobileCount, initParticles]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 1,
            }}
        />
    );
};
