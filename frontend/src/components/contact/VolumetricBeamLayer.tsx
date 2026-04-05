/**
 * VolumetricBeamLayer
 * ===================
 * Canvas-based volumetric light beams emerging from the opened folder.
 * Additive blending, animated opacity, linked to interior glow.
 */

import React, { useRef, useEffect, useCallback } from "react";

interface VolumetricBeamLayerProps {
    intensity: number;   // 0–1
    warmth: number;      // 0–1, from LightingAdapter
    active: boolean;
}

const BEAM_COUNT = 5;

interface Beam {
    x: number;      // 0–1 horizontal position
    width: number;  // px
    angle: number;  // degrees
    speed: number;  // opacity oscillation speed
    phase: number;  // offset
}

function createBeams(): Beam[] {
    return Array.from({ length: BEAM_COUNT }, (_, i) => ({
        x: 0.2 + (i / (BEAM_COUNT - 1)) * 0.6,
        width: 8 + Math.random() * 14,
        angle: -4 + Math.random() * 8,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
    }));
}

export const VolumetricBeamLayer: React.FC<VolumetricBeamLayerProps> = ({
    intensity,
    warmth,
    active,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const beamsRef = useRef<Beam[]>(createBeams());
    const rafRef = useRef<number>(0);

    const draw = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (intensity < 0.01) {
            rafRef.current = requestAnimationFrame(draw);
            return;
        }

        ctx.globalCompositeOperation = "lighter";

        const beams = beamsRef.current;
        const t = time / 1000;

        for (const beam of beams) {
            const osc = 0.5 + 0.5 * Math.sin(t * beam.speed + beam.phase);
            const alpha = intensity * osc * 0.35;

            const cx = beam.x * w;
            const grad = ctx.createLinearGradient(cx, h, cx, h * 0.1);

            const r = Math.round(255 * (0.9 + warmth * 0.1));
            const g = Math.round(200 * (0.6 + warmth * 0.4));
            const b = Math.round(180 * (0.4 + warmth * 0.3));

            grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
            grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.4})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

            ctx.save();
            ctx.translate(cx, h);
            ctx.rotate((beam.angle * Math.PI) / 180);
            ctx.translate(-cx, -h);

            ctx.fillStyle = grad;
            ctx.fillRect(cx - beam.width / 2, h * 0.1, beam.width, h * 0.9);
            ctx.restore();
        }

        ctx.globalCompositeOperation = "source-over";
        rafRef.current = requestAnimationFrame(draw);
    }, [intensity, warmth]);

    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
        }
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, [active, draw]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{
                width: "100%",
                height: "100%",
                mixBlendMode: "screen",
                opacity: Math.min(intensity, 1),
                zIndex: 5,
            }}
        />
    );
};
