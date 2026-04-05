import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { globalLighting, type LightingState } from "@/engine/lighting/GlobalLighting";
import { stateManager, type MultiverseState } from "@/engine/MultiverseStateManager";

// ── Types ────────────────────────────────────────────────────────────────
interface GlassyButtonProps {
    children: React.ReactNode;
    className?: string;
    variant?: "nav" | "footer" | "cta";
    href?: string;
    onClick?: (e: React.MouseEvent) => void;
    disabled?: boolean;
}

// ── CSS for glass layers (injected once) ──────────────────────────────────
const GLASS_STYLES = `
.glassy-btn {
    --mx: 0.5;
    --my: 0.5;
    --rim-x: 1;
    --rim-y: 0.5;
    --rim-int: 0.4;
    --glow-mult: 1;
    --compress: 1;
    --chroma: 0;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    transform-style: preserve-3d;
    perspective: 800px;
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1);
    will-change: transform;
}

/* ── BORDER LEFT ── */
.glassy-border-l {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 6px;
    background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%);
    border-radius: 3px 0 0 3px;
    pointer-events: none;
    z-index: 2;
}

/* ── BORDER MID ── */
.glassy-border-m {
    position: absolute;
    left: 5px; right: 5px; top: 0;
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.2));
    pointer-events: none;
    z-index: 2;
}

/* ── BORDER RIGHT ── */
.glassy-border-r {
    position: absolute;
    right: 0; top: 0; bottom: 0;
    width: 6px;
    background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 100%);
    border-radius: 0 3px 3px 0;
    pointer-events: none;
    z-index: 2;
}

/* ── FILL LAYER ── */
.glassy-fill {
    position: absolute;
    inset: 0;
    background: rgba(10,10,15,0.45);
    backdrop-filter: blur(var(--blur, 12px));
    -webkit-backdrop-filter: blur(var(--blur, 12px));
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 4px;
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.04),
        inset 0 -1px 2px rgba(0,0,0,0.3),
        0 0 0 0.5px rgba(255,255,255,0.04);
    overflow: hidden;
    z-index: 0;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

/* Cursor-following radial highlight */
.glassy-fill::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    left: calc(var(--mx) * 100% - 100%);
    top: calc(var(--my) * 100% - 100%);
    background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 60%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}
.glassy-btn:hover .glassy-fill::before { opacity: 1; }

/* Top light gradient overlay */
.glassy-fill::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        180deg,
        rgba(255,255,255,0.04) 0%,
        transparent 40%
    );
    pointer-events: none;
}

/* Directional lighting shine */
.glassy-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        calc(var(--rim-x) * 180deg),
        rgba(255,255,255, calc(0.03 * var(--rim-int) * var(--glow-mult))) 0%,
        transparent 60%
    );
    pointer-events: none;
    z-index: 1;
    border-radius: 4px;
}

/* ── REFLECTION LAYER ── */
.glassy-reflect {
    position: absolute;
    left: 0; right: 0;
    bottom: 0;
    height: 40%;
    background: linear-gradient(
        0deg,
        rgba(255,255,255,0.08) 0%,
        rgba(255,255,255,0.02) 50%,
        transparent 100%
    );
    mask-image: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%);
    pointer-events: none;
    z-index: 1;
    border-radius: 0 0 4px 4px;
    opacity: calc(1 * var(--compress));
    transition: opacity 0.4s ease;
}

/* ── CONTENT LAYER ── */
.glassy-content {
    position: relative;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), filter 0.3s ease;
}

/* ── HOVER STATE ── */
.glassy-btn:hover {
    transform: translateZ(6px) scaleY(var(--compress));
}
.glassy-btn:hover .glassy-fill {
    border-color: rgba(255,255,255,0.12);
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.06),
        inset 0 -1px 2px rgba(0,0,0,0.3),
        0 0 12px rgba(255,255,255,0.04),
        0 0 0 0.5px rgba(255,255,255,0.08);
}
.glassy-btn:hover .glassy-content {
    filter: brightness(1.15);
}
.glassy-btn:hover .glassy-border-l,
.glassy-btn:hover .glassy-border-r {
    background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%);
}
.glassy-btn:hover .glassy-border-m {
    background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3));
}

/* Shimmer animation on hover */
@keyframes glassy-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
}
.glassy-btn:hover .glassy-reflect::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    animation: glassy-shimmer 1.5s ease-in-out infinite;
}

/* ── ACTIVE / PRESSED STATE ── */
.glassy-btn:active {
    transform: translateZ(0px) scale(0.98) scaleY(var(--compress));
}
.glassy-btn:active .glassy-fill {
    box-shadow:
        inset 0 2px 4px rgba(0,0,0,0.5),
        inset 0 -1px 2px rgba(0,0,0,0.3);
}
.glassy-btn:active .glassy-content {
    filter: brightness(0.95);
}

/* ── CAUSTIC RIPPLE ── */
@keyframes caustic-ripple {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(4); opacity: 0; }
}
.glassy-caustic {
    position: absolute;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.3), rgba(177,18,38,0.15), transparent);
    pointer-events: none;
    z-index: 4;
    animation: caustic-ripple 400ms cubic-bezier(0.22,1,0.36,1) forwards;
}

/* ── CHROMATIC BURST (MULTIVERSE_TEAR) ── */
@keyframes chroma-burst {
    0% { box-shadow: -2px 0 0 rgba(177,18,38,0.6), 2px 0 0 rgba(0,240,255,0.4); }
    100% { box-shadow: 0 0 0 transparent, 0 0 0 transparent; }
}
.glassy-chroma-burst {
    animation: chroma-burst 120ms ease-out forwards;
}

/* ── ENERGY BUILD GLOW ── */
@keyframes energy-glow {
    0%, 100% { box-shadow: 0 0 6px rgba(177,18,38,0.15); }
    50% { box-shadow: 0 0 18px rgba(177,18,38,0.3), 0 0 40px rgba(140,0,180,0.1); }
}
.glassy-energy .glassy-fill {
    animation: energy-glow 2s ease-in-out infinite;
}

/* ── FOOTER VARIANT ── */
.glassy-btn.glassy-footer .glassy-fill {
    --blur: 8px;
}
.glassy-btn.glassy-footer .glassy-reflect {
    opacity: calc(0.5 * var(--compress));
}

/* ── CTA VARIANT ── */
.glassy-btn.glassy-cta .glassy-fill {
    background: rgba(177,18,38,0.12);
    border-color: rgba(177,18,38,0.25);
}
.glassy-btn.glassy-cta:hover .glassy-fill {
    border-color: rgba(177,18,38,0.45);
    box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.06),
        inset 0 -1px 2px rgba(0,0,0,0.3),
        0 0 20px rgba(177,18,38,0.15),
        0 0 0 0.5px rgba(177,18,38,0.3);
}

/* ── DEPTH COMPRESSION ── */
.glassy-btn {
    transform: scaleY(var(--compress));
}
`;

// Inject styles once
let stylesInjected = false;
function injectStyles() {
    if (stylesInjected || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.id = "glassy-button-styles";
    style.textContent = GLASS_STYLES;
    document.head.appendChild(style);
    stylesInjected = true;
}

// ── Component ────────────────────────────────────────────────────────────
export const GlassyButton: React.FC<GlassyButtonProps> = ({
    children,
    className,
    variant = "nav",
    href,
    onClick,
    disabled = false,
}) => {
    const btnRef = useRef<HTMLDivElement>(null);
    const [caustics, setCaustics] = useState<{ id: number; x: number; y: number }[]>([]);
    const [mvState, setMvState] = useState<MultiverseState>("STABLE");
    const causticId = useRef(0);

    // Inject global styles
    useEffect(() => { injectStyles(); }, []);

    // ── GlobalLighting subscription ─────────────────────────────────
    useEffect(() => {
        globalLighting.init();
        const updateLighting = (ls: LightingState) => {
            if (!btnRef.current) return;
            const el = btnRef.current;
            el.style.setProperty("--rim-x", String(ls.rimDirection[0]));
            el.style.setProperty("--rim-y", String(ls.rimDirection[1]));
            el.style.setProperty("--rim-int", String(ls.rimIntensity));
            el.style.setProperty("--glow-mult", String(ls.hdrExposure));
        };
        // Initial
        const ls = globalLighting.getState();
        if (btnRef.current) {
            btnRef.current.style.setProperty("--rim-x", String(ls.rimDirection[0]));
            btnRef.current.style.setProperty("--rim-y", String(ls.rimDirection[1]));
            btnRef.current.style.setProperty("--rim-int", String(ls.rimIntensity));
            btnRef.current.style.setProperty("--glow-mult", String(ls.hdrExposure));
        }
        return globalLighting.subscribe(updateLighting);
    }, []);

    // ── MultiverseState subscription ────────────────────────────────
    useEffect(() => {
        const unsub = stateManager.on((state) => {
            setMvState(state);
        });
        return () => { unsub(); };
    }, []);

    // ── Cursor tracking (CSS variables — no re-renders) ─────────────
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const el = btnRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;
        el.style.setProperty("--mx", String(mx));
        el.style.setProperty("--my", String(my));
    }, []);

    // ── Caustic click ripple ────────────────────────────────────────
    const handleClick = useCallback((e: React.MouseEvent) => {
        if (disabled) return;
        const el = btnRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const id = causticId.current++;
            setCaustics(prev => [...prev, { id, x, y }]);
            setTimeout(() => {
                setCaustics(prev => prev.filter(c => c.id !== id));
            }, 450);
        }
        onClick?.(e);
    }, [disabled, onClick]);

    // ── Variant classes ─────────────────────────────────────────────
    const variantClass = useMemo(() => {
        if (variant === "footer") return "glassy-footer";
        if (variant === "cta") return "glassy-cta";
        return "";
    }, [variant]);

    const stateClass = useMemo(() => {
        if (mvState === "ENERGY_BUILD") return "glassy-energy";
        if (mvState === "MULTIVERSE_TEAR") return "glassy-chroma-burst";
        return "";
    }, [mvState]);

    const paddingClass = useMemo(() => {
        if (variant === "cta") return "px-6 py-2.5";
        if (variant === "footer") return "px-4 py-2";
        return "px-5 py-2";
    }, [variant]);

    const inner = (
        <div
            ref={btnRef}
            className={cn(
                "glassy-btn",
                variantClass,
                stateClass,
                paddingClass,
                disabled && "opacity-40 pointer-events-none",
                className,
            )}
            onMouseMove={handleMouseMove}
            onClick={href ? undefined : handleClick}
            role="button"
            tabIndex={0}
        >
            {/* Border System */}
            <div className="glassy-border-l" />
            <div className="glassy-border-m" />
            <div className="glassy-border-r" />

            {/* Fill Layer */}
            <div className="glassy-fill" />

            {/* Directional Lighting Shine */}
            <div className="glassy-shine" />

            {/* Reflection Layer */}
            <div className="glassy-reflect" />

            {/* Content Layer */}
            <div className="glassy-content">
                <span className="relative">
                    {/* Chromatic red offset */}
                    <span
                        className="absolute inset-0 text-[#B11226] opacity-0 pointer-events-none mix-blend-screen"
                        style={{ transform: `translate(${mvState === 'MULTIVERSE_TEAR' ? -2 : -0.5}px, 0.5px)`, transition: 'all 0.12s', filter: 'blur(0.3px)' }}
                        aria-hidden
                    >
                        {children}
                    </span>
                    {/* Chromatic blue offset */}
                    <span
                        className="absolute inset-0 text-[#00F0FF] opacity-0 pointer-events-none mix-blend-screen"
                        style={{ transform: `translate(${mvState === 'MULTIVERSE_TEAR' ? 2 : 0.5}px, -0.5px)`, transition: 'all 0.12s', filter: 'blur(0.3px)' }}
                        aria-hidden
                    >
                        {children}
                    </span>
                    {/* Base text */}
                    <span className="relative z-10">{children}</span>
                </span>
            </div>

            {/* Caustic ripples */}
            {caustics.map(c => (
                <div
                    key={c.id}
                    className="glassy-caustic"
                    style={{ left: c.x - 20, top: c.y - 20 }}
                />
            ))}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="inline-block" onClick={handleClick}>
                {inner}
            </Link>
        );
    }

    return inner;
};
