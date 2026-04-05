import React, { useEffect, useRef } from "react";

interface HaloSource {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    radius: number;
}

interface HaloBannerProps {
    colors?: [string, string, string];
    sources?: number;
    speed?: number;
    className?: string;
}

export const HaloBanner: React.FC<HaloBannerProps> = ({
    colors = ["#B11226", "#5A0E16", "#1a0a2e"],
    sources = 5,
    speed = 0.4,
    className = "",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const halosRef = useRef<HaloSource[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        resize();
        window.addEventListener("resize", resize);

        // Initialize halo sources
        const rect = canvas.getBoundingClientRect();
        halosRef.current = Array.from({ length: sources }, (_, i) => ({
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            vx: (Math.random() - 0.5) * speed * 2,
            vy: (Math.random() - 0.5) * speed * 2,
            color: colors[i % colors.length],
            radius: 80 + Math.random() * 120,
        }));

        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;

            ctx.clearRect(0, 0, w, h);

            // Dark base
            ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
            ctx.fillRect(0, 0, w, h);

            // Draw and animate each halo source
            for (const halo of halosRef.current) {
                // Move
                halo.x += halo.vx;
                halo.y += halo.vy;

                // Bounce off edges with padding
                if (halo.x < -50 || halo.x > w + 50) halo.vx *= -1;
                if (halo.y < -50 || halo.y > h + 50) halo.vy *= -1;

                // Draw radial gradient glow
                const gradient = ctx.createRadialGradient(
                    halo.x,
                    halo.y,
                    0,
                    halo.x,
                    halo.y,
                    halo.radius
                );

                // Parse hex color and create transparent versions
                const r = parseInt(halo.color.slice(1, 3), 16);
                const g = parseInt(halo.color.slice(3, 5), 16);
                const b = parseInt(halo.color.slice(5, 7), 16);

                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
                gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.15)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

                ctx.globalCompositeOperation = "lighter";
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(halo.x, halo.y, halo.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Reset composite
            ctx.globalCompositeOperation = "source-over";

            animRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animRef.current);
        };
    }, [colors, sources, speed]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full ${className}`}
            style={{ display: "block" }}
        />
    );
};
