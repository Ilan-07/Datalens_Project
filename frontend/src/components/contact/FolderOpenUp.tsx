/**
 * FolderOpenUp — v3
 * =================
 * Premium 3D folder with 3 identity cards.
 * Cards pop up above folder in a flex row, slide back on toggle.
 * Glitch/chromatic text on cards. Micro-parallax per card.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { FolderAnimationController, type FolderAnimValues, type FolderState } from "./FolderAnimationController";
import { LightingAdapter, type FolderLighting } from "./LightingAdapter";
import { VolumetricBeamLayer } from "./VolumetricBeamLayer";
import { DepthParticleSystem } from "./DepthParticleSystem";
import { ChromaticText } from "@/components/ui/ChromaticText";

// ── Injected Styles ──────────────────────────────────────────────────
const FOLDER_STYLES = `
.folder-scene {
    perspective: 1200px;
    transform-style: preserve-3d;
}
.folder-body {
    transform-style: preserve-3d;
    transform-origin: bottom center;
    will-change: transform;
}
.folder-flap {
    transform-style: preserve-3d;
    transform-origin: bottom center;
    will-change: transform;
    backface-visibility: hidden;
}
.folder-grain {
    background-image:
        url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8 0.15' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
    background-size: 200px 200px;
}

/* Identity card */
.identity-card {
    transform-style: preserve-3d;
    will-change: transform, opacity;
    --mx: 0.5;
    --my: 0.5;
}
.identity-card-highlight {
    background: radial-gradient(
        circle at calc(var(--mx) * 100%) calc(var(--my) * 100%),
        rgba(255,255,255,0.07) 0%,
        transparent 60%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
}
.identity-card:hover .identity-card-highlight {
    opacity: 1;
}

@keyframes chromatic-edge-pulse {
    0% { box-shadow: -2px 0 0 rgba(177,18,38,0.4), 2px 0 0 rgba(0,240,255,0.25); }
    100% { box-shadow: none; }
}
.folder-chromatic-pulse {
    animation: chromatic-edge-pulse 120ms ease-out forwards;
}
.folder-bloom {
    box-shadow:
        0 0 40px rgba(255,200,150,0.03),
        0 0 80px rgba(255,180,120,0.02);
}

@media (hover: none) {
    .identity-card:active {
        transform: scale(1.015) !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
    }
}
`;

let folderStylesInjected = false;
function injectFolderStyles() {
    if (folderStylesInjected || typeof document === "undefined") return;
    const s = document.createElement("style");
    s.id = "folder-open-styles";
    s.textContent = FOLDER_STYLES;
    document.head.appendChild(s);
    folderStylesInjected = true;
}

// ── Identity Card with Micro-Parallax ────────────────────────────────
interface IdentityCardProps {
    children: React.ReactNode;
    className?: string;
    fanRotation: number;
    delay: number;
    isOpen: boolean;
    lighting: FolderLighting | null;
}

const IdentityCard: React.FC<IdentityCardProps> = ({
    children,
    className,
    fanRotation,
    delay,
    isOpen,
    lighting,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const targetRef = useRef({ rx: 0, ry: 0 });
    const currentRef = useRef({ rx: 0, ry: 0 });
    const isTouchRef = useRef(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            isTouchRef.current = "ontouchstart" in window;
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isTouchRef.current) return;
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;
        targetRef.current = {
            rx: (my - 0.5) * -8,
            ry: (mx - 0.5) * 8,
        };
        el.style.setProperty("--mx", String(mx));
        el.style.setProperty("--my", String(my));

        if (!rafRef.current) {
            const animate = () => {
                const cur = currentRef.current;
                const tgt = targetRef.current;
                cur.rx += (tgt.rx - cur.rx) * 0.08;
                cur.ry += (tgt.ry - cur.ry) * 0.08;

                if (cardRef.current) {
                    cardRef.current.style.transform = `
                        rotateY(${fanRotation}deg)
                        rotateX(${cur.rx}deg)
                        rotateY(${cur.ry}deg)
                    `;
                }

                if (Math.abs(cur.rx - tgt.rx) > 0.01 || Math.abs(cur.ry - tgt.ry) > 0.01) {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    rafRef.current = 0;
                }
            };
            rafRef.current = requestAnimationFrame(animate);
        }
    }, [fanRotation]);

    const handleMouseLeave = useCallback(() => {
        targetRef.current = { rx: 0, ry: 0 };
        if (cardRef.current) {
            cardRef.current.style.setProperty("--mx", "0.5");
            cardRef.current.style.setProperty("--my", "0.5");
        }
        if (!rafRef.current) {
            const animate = () => {
                const cur = currentRef.current;
                cur.rx += (0 - cur.rx) * 0.06;
                cur.ry += (0 - cur.ry) * 0.06;

                if (cardRef.current) {
                    cardRef.current.style.transform = `
                        rotateY(${fanRotation}deg)
                        rotateX(${cur.rx}deg)
                        rotateY(${cur.ry}deg)
                    `;
                }

                if (Math.abs(cur.rx) > 0.01 || Math.abs(cur.ry) > 0.01) {
                    rafRef.current = requestAnimationFrame(animate);
                } else {
                    currentRef.current = { rx: 0, ry: 0 };
                    if (cardRef.current) {
                        cardRef.current.style.transform = `rotateY(${fanRotation}deg)`;
                    }
                    rafRef.current = 0;
                }
            };
            rafRef.current = requestAnimationFrame(animate);
        }
    }, [fanRotation]);

    useEffect(() => {
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    const edgeHighlight = lighting
        ? `linear-gradient(${180 + lighting.shadowAngle * 0.3}deg, rgba(255,255,255,0.06) 0%, transparent 40%)`
        : "none";

    return (
        <div
            ref={cardRef}
            className={cn("identity-card relative", className)}
            style={{
                transform: `rotateY(${fanRotation}deg) translateY(${isOpen ? 0 : 60}px)`,
                opacity: isOpen ? 1 : 0,
                transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
                pointerEvents: isOpen ? "auto" : "none",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="rounded-2xl overflow-hidden relative flex flex-col h-full"
                style={{
                    background: "#f8f8f8",
                    boxShadow: `
                        0 6px 24px rgba(0,0,0,0.18),
                        0 1px 4px rgba(0,0,0,0.1),
                        inset 0 1px 0 rgba(255,255,255,0.8),
                        inset 0 -1px 2px rgba(0,0,0,0.04)
                    `,
                }}
            >
                <div className="relative flex flex-col flex-1">
                    {children}
                </div>

                {/* Highlight overlay */}
                <div className="identity-card-highlight absolute inset-0 rounded-2xl pointer-events-none" style={{ zIndex: 2 }} />

                {/* Inner shadow */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 2px 6px rgba(0,0,0,0.03)", zIndex: 1 }} />

                {/* Directional edge shading */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: edgeHighlight, zIndex: 3 }} />
            </div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────
export const FolderOpenUp: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [anim, setAnim] = useState<FolderAnimValues | null>(null);
    const [lighting, setLighting] = useState<FolderLighting | null>(null);
    const [folderState, setFolderState] = useState<FolderState>("CLOSED");
    const [cardsOpen, setCardsOpen] = useState(false);

    const [tiltX, setTiltX] = useState(0);
    const [tiltY, setTiltY] = useState(0);

    const controllerRef = useRef<FolderAnimationController | null>(null);
    const lightRef = useRef<LightingAdapter | null>(null);

    useEffect(() => {
        injectFolderStyles();

        const ctrl = new FolderAnimationController();
        const la = new LightingAdapter();
        controllerRef.current = ctrl;
        lightRef.current = la;

        const unsubAnim = ctrl.subscribe((vals) => {
            setAnim({ ...vals });
            la.updateRotation(vals.rotateX);
        });
        const unsubLight = la.subscribe((ls) => setLighting({ ...ls }));

        la.start();
        setAnim(ctrl.getValues());
        setLighting(la.getState());

        return () => {
            unsubAnim();
            unsubLight();
            ctrl.destroy();
            la.destroy();
        };
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width - 0.5;
        const my = (e.clientY - rect.top) / rect.height - 0.5;
        setTiltX(-my * 3);
        setTiltY(mx * 3);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTiltX(0);
        setTiltY(0);
        if (folderState === "HOVER") {
            controllerRef.current?.transitionTo("CLOSED");
            setFolderState("CLOSED");
        }
    }, [folderState]);

    const handleMouseEnter = useCallback(() => {
        if (folderState === "CLOSED") {
            controllerRef.current?.transitionTo("HOVER");
            setFolderState("HOVER");
        }
    }, [folderState]);

    // Toggle open/close
    const handleClick = useCallback(() => {
        if (cardsOpen) {
            // CLOSE: retract cards, close folder
            setCardsOpen(false);
            controllerRef.current?.transitionTo("HOVER");
            setFolderState("HOVER");
        } else {
            // OPEN: open folder, deploy cards
            controllerRef.current?.transitionTo("OPEN");
            setFolderState("OPEN");
            setTimeout(() => setCardsOpen(true), 400);
        }
    }, [cardsOpen]);

    if (!anim || !lighting) return null;

    const isOpen = folderState === "OPEN" || folderState === "FORM_VISIBLE";
    const chromaticPulse = anim.chromaticPulse > 0.5;

    return (
        <div className="relative flex flex-col items-center">
            {/* ── CARDS ROW (above folder) ── */}
            <div
                className="flex items-stretch justify-center gap-5 mb-6 w-full max-w-2xl px-4"
                style={{
                    perspective: "900px",
                    minHeight: cardsOpen ? "auto" : 0,
                    overflow: "visible",
                }}
            >
                {/* Card 1 — Brand */}
                <IdentityCard
                    fanRotation={cardsOpen ? -6 : 0}
                    delay={0}
                    isOpen={cardsOpen}
                    lighting={lighting}
                    className="flex-1 min-w-0 h-[220px]"
                >
                    <div className="text-center p-6 flex flex-col justify-between h-full" style={{ fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}>
                        <h3
                            className="text-[24px] font-bold tracking-[0.02em] text-[#000000] mb-3"
                            style={{
                                textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                            }}
                        >
                            <ChromaticText text="DATALENS™" intensity={2} />
                        </h3>
                        <p className="text-[18px] text-[#555555] font-semibold tracking-[0.01em]">
                            <ChromaticText text="AI Data Intelligence Platform" intensity={1} />
                        </p>
                    </div>
                </IdentityCard>

                {/* Card 2 — Description */}
                <IdentityCard
                    fanRotation={0}
                    delay={80}
                    isOpen={cardsOpen}
                    lighting={lighting}
                    className="flex-1 min-w-0 h-[220px]"
                >
                    <div className="text-center p-6 flex items-center justify-center h-full" style={{ fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}>
                        <p className="text-[16px] leading-relaxed text-[#000000] font-medium tracking-[0.01em]">
                            <ChromaticText
                                text="An immersive AI-powered data intelligence system transforming analytics into spatial experience."
                                intensity={1}
                            />
                        </p>
                    </div>
                </IdentityCard>

                {/* Card 3 — Contact */}
                <IdentityCard
                    fanRotation={cardsOpen ? 6 : 0}
                    delay={160}
                    isOpen={cardsOpen}
                    lighting={lighting}
                    className="flex-1 min-w-0 h-[220px]"
                >
                    <div className="p-6 flex flex-col justify-between h-full space-y-4" style={{ fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif' }}>
                        <div>
                            <p className="text-[15px] text-[#555555] font-semibold tracking-[0.01em] mb-1.5">
                                <ChromaticText text="Email" intensity={1} />
                            </p>
                            <p className="text-[16px] text-[#000000] font-medium tracking-[0.01em]">
                                <ChromaticText text="datalens@gmail.org" intensity={2} />
                            </p>
                        </div>
                        <div>
                            <p className="text-[15px] text-[#555555] font-semibold tracking-[0.01em] mb-1.5">
                                <ChromaticText text="Phone" intensity={1} />
                            </p>
                            <p className="text-[16px] text-[#000000] font-medium tracking-[0.01em]">
                                <ChromaticText text="9629071710" intensity={2} />
                            </p>
                        </div>
                    </div>
                </IdentityCard>
            </div>

            {/* ── CONTACT SHADOW ── */}
            <div
                className="absolute left-1/2 -translate-x-1/2 w-[80%] h-8"
                style={{
                    bottom: "-16px",
                    background: "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.35) 0%, transparent 70%)",
                    filter: "blur(12px)",
                    transform: `translateX(-50%) scaleX(${1 + anim.shadowDepth * 0.3})`,
                    zIndex: 0,
                }}
            />

            {/* ── FOLDER ── */}
            <div
                ref={containerRef}
                className="folder-scene relative w-full max-w-lg mx-auto cursor-pointer"
                style={{
                    height: 240,
                    transition: "height 0.6s cubic-bezier(0.22,1,0.36,1)",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={handleMouseEnter}
            >
                <div
                    className="folder-body relative w-full h-full"
                    style={{
                        transform: `
                            rotateX(${tiltX}deg)
                            rotateY(${tiltY}deg)
                            translateZ(${anim.translateZ}px)
                        `,
                        transition: "transform 0.2s ease-out",
                    }}
                >
                    {/* BACK LAYER */}
                    <div
                        className="absolute inset-x-0 bottom-0 folder-grain"
                        style={{
                            height: "88%",
                            background: `linear-gradient(
                                ${175 + lighting.shadowAngle * 0.2}deg,
                                rgba(42,42,48,0.97) 0%,
                                rgba(28,28,32,0.98) 40%,
                                rgba(22,22,26,0.99) 100%
                            )`,
                            borderRadius: "18px 18px 16px 16px",
                            boxShadow: `
                                0 ${12 + anim.shadowDepth * 30}px ${30 + anim.shadowDepth * 50}px rgba(0,0,0,${0.35 + anim.shadowDepth * 0.35}),
                                0 2px 4px rgba(0,0,0,0.2),
                                inset 0 1px 0 rgba(255,255,255,0.04),
                                inset 0 -2px 6px rgba(0,0,0,0.15)
                            `,
                            border: "1px solid rgba(255,255,255,0.04)",
                            zIndex: 1,
                        }}
                    />

                    {/* INTERIOR */}
                    <div
                        className="absolute inset-x-3 bottom-3"
                        style={{
                            height: "82%",
                            borderRadius: "14px",
                            background: `radial-gradient(
                                ellipse at 50% 85%,
                                rgba(${155 + lighting.interiorWarmth * 100}, ${105 + lighting.interiorWarmth * 55}, ${65 + lighting.interiorWarmth * 35}, ${anim.glowIntensity * 0.35}) 0%,
                                rgba(16,16,18,0.6) 50%,
                                rgba(12,12,14,0.3) 100%
                            )`,
                            zIndex: 2,
                            pointerEvents: "none",
                        }}
                    />

                    {/* VOLUMETRIC BEAMS */}
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                        <VolumetricBeamLayer
                            intensity={anim.beamOpacity * 0.5}
                            warmth={lighting.interiorWarmth}
                            active={isOpen}
                        />
                    </div>

                    {/* DEPTH PARTICLES */}
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
                        <DepthParticleSystem
                            opacity={anim.particleOpacity * 0.5}
                            brightness={lighting.ambientBrightness}
                            active={isOpen}
                        />
                    </div>

                    {/* FRONT FLAP */}
                    <div
                        className={cn(
                            "folder-flap absolute inset-x-0 top-0 folder-grain",
                            chromaticPulse && "folder-chromatic-pulse",
                            isOpen && "folder-bloom",
                        )}
                        style={{
                            height: "40%",
                            borderRadius: "18px 18px 0 0",
                            background: `linear-gradient(
                                ${175 + lighting.shadowAngle * 0.15}deg,
                                rgba(48,48,54,0.97) 0%,
                                rgba(35,35,40,0.98) 50%,
                                rgba(30,30,34,0.99) 100%
                            )`,
                            transform: `rotateX(${anim.rotateX}deg)`,
                            boxShadow: `
                                0 -2px 16px rgba(0,0,0,${anim.shadowDepth * 0.25}),
                                inset 0 -1px 0 rgba(255,255,255,0.03),
                                inset 0 1px 0 rgba(255,255,255,0.06)
                            `,
                            border: "1px solid rgba(255,255,255,0.05)",
                            zIndex: 8,
                        }}
                        onClick={handleClick}
                    >
                        {/* Tab */}
                        <div
                            className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-1.5"
                            style={{
                                background: "linear-gradient(180deg, rgba(48,48,54,0.97) 0%, rgba(38,38,44,0.98) 100%)",
                                borderRadius: "10px 10px 0 0",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderBottom: "none",
                            }}
                        >
                            <span className="text-[9px] text-dim uppercase tracking-[0.5em] font-black">
                                Contact
                            </span>
                        </div>

                        {/* Top edge highlight */}
                        <div
                            className="absolute inset-x-0 top-0 h-px"
                            style={{
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                                borderRadius: "18px 18px 0 0",
                            }}
                        />

                        {/* Bottom reflection */}
                        <div
                            className="absolute inset-x-0 bottom-0"
                            style={{
                                height: "30%",
                                background: `linear-gradient(0deg, rgba(255,255,255,${0.015 + anim.reflectionIntensity * 0.03}) 0%, transparent 100%)`,
                                pointerEvents: "none",
                            }}
                        />

                        {/* Label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-dim/30 text-[10px] uppercase tracking-[0.5em] font-black">
                                {cardsOpen
                                    ? "Click to Close"
                                    : folderState === "CLOSED"
                                        ? "Hover to Peek"
                                        : "Click to Open"
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ambient reflection beneath */}
            <div
                className="mx-auto mt-1 w-[70%] h-6 pointer-events-none"
                style={{
                    background: "linear-gradient(180deg, rgba(42,42,48,0.08) 0%, transparent 100%)",
                    filter: "blur(4px)",
                    borderRadius: "0 0 50% 50%",
                    opacity: 0.5 + anim.shadowDepth * 0.3,
                }}
            />
        </div>
    );
};
