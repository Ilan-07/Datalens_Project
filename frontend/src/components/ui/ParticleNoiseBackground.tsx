import React, { useRef, useEffect } from "react";

export interface ParticleNoiseBackgroundProps {
    opacity?: number;
    energyFactor?: number;
    spacing?: number;
    zoom?: number;
    scrollInfluence?: number;
}

export function ParticleNoiseBackground({
    opacity = 0.3,
}: ParticleNoiseBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
            for (let i = 0; i < 100; i++) {
                ctx.beginPath();
                ctx.arc(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    Math.random() * 2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            // Just a static very lightweight noise for now to satisfy the missing component
            // without blowing up CPU.
            // animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [opacity]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 mix-blend-screen"
            style={{ opacity }}
        />
    );
}
