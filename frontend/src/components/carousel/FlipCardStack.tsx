import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    motion,
    AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import type { DatasetCard } from "@/engine/data/DatasetAnalyzer";

/* ═══════════════════════════════════════════════════════════════════════
   FlipCardStack — Infinite Cinematic Drag-to-Send-Back Stack
   ═══════════════════════════════════════════════════════════════════════ */

interface FlipCardStackProps {
    cards: DatasetCard[];
    className?: string;
}

/* ── Severity → colour mapping ──────────────────────────────────────── */
const severityColor = (s: number) =>
    s >= 2 ? "#B11226" : s === 1 ? "#F59E0B" : "#00F0FF";

const severityLabel = (s: number) =>
    s >= 2 ? "CRITICAL" : s === 1 ? "WARNING" : "NOMINAL";

/* ── Physics-tuned spring configs ───────────────────────────────────── */
const STACK_SPRING = {
    type: "spring" as const,
    stiffness: 280,
    damping: 26,
    mass: 0.85,
};
const AMBIENT_SPRING = {
    type: "spring" as const,
    stiffness: 160,
    damping: 28,
    mass: 1.2,
};

const DRAG_THRESHOLD = 100;
const VISIBLE_CARDS = 3;

/* ── Per-layer depth configuration ──────────────────────────────────── */
const LAYER_CONFIG = [
    { scale: 1.0, y: 0, opacity: 1 },
    { scale: 0.955, y: 12, opacity: 0.88 },
    { scale: 0.91, y: 22, opacity: 0.75 },
];

/* ═══════════════════════════════════════════════════════════════════════
   Single Draggable Card
   ═══════════════════════════════════════════════════════════════════════ */

interface StackCardProps {
    card: DatasetCard;
    stackIndex: number;
    total: number;
    isExpanded: boolean;
    isAnyExpanded: boolean;
    onSendToBack: () => void;
    onExpand: () => void;
    onCollapse: () => void;
}

const StackCard: React.FC<StackCardProps> = ({
    card,
    stackIndex,
    total,
    isExpanded,
    isAnyExpanded,
    onSendToBack,
    onExpand,
    onCollapse,
}) => {
    const isFront = stackIndex === 0;
    const isVisible = stackIndex < VISIBLE_CARDS;
    const cardRef = useRef<HTMLDivElement>(null);

    // ── Click-outside listener for expanded state ───────────────────
    useEffect(() => {
        if (!isExpanded || !isFront) return;
        const handler = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onCollapse();
            }
        };
        const timer = setTimeout(() => document.addEventListener("mousedown", handler), 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handler);
        };
    }, [isExpanded, isFront, onCollapse]);

    const layer = LAYER_CONFIG[Math.min(stackIndex, VISIBLE_CARDS - 1)];
    const accentColor = severityColor(card.severity);

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                "absolute inset-0 will-change-transform",
                isFront ? "cursor-pointer" : "cursor-default"
            )}
            style={{
                zIndex: total - stackIndex,
                pointerEvents: isVisible ? "auto" : "none",
            }}
            animate={{
                scale: isExpanded && isFront ? 1.03 : layer.scale,
                y: isExpanded && isFront ? -10 : layer.y,
                opacity: isVisible ? layer.opacity : 0,
            }}
            transition={STACK_SPRING}
            onClick={() => {
                if (!isFront || isAnyExpanded) return;
                onExpand();
            }}
            whileHover={
                isFront && !isExpanded && !isAnyExpanded
                    ? { scale: 1.025, y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }
                    : undefined
            }
        >
            {/* ── Card Surface ──────────────────────────────────────── */}
            <div
                className={cn(
                    "relative w-full h-full rounded-[22px] overflow-hidden select-none",
                    "transition-all duration-500",
                    isFront
                        ? "border border-white/[0.12] shadow-[0_10px_50px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4),0_0px_100px_rgba(177,18,38,0.08)]"
                        : stackIndex === 1
                            ? "border border-white/[0.06] shadow-[0_6px_30px_rgba(0,0,0,0.35)]"
                            : "border border-white/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
                )}
            >
                {/* ── Premium Glossy Collapse Button (top-left) ───── */}
                {isExpanded && isFront && (
                    <motion.button
                        className="absolute top-5 left-5 z-30 flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-[16px] transition-all duration-200 hover:scale-105 active:scale-95 group"
                        style={{
                            background: `linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))`,
                            borderColor: `rgba(255,255,255,0.12)`,
                            boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.1) inset`,
                        }}
                        initial={{ opacity: 0, x: -10, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.9 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 25 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCollapse();
                        }}
                    >
                        {/* Chevron icon */}
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            className="transition-transform duration-200 group-hover:-translate-x-0.5"
                        >
                            <path
                                d="M9 3L5 7L9 11"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white/70 group-hover:text-white"
                            />
                        </svg>
                        <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-white/60 group-hover:text-white/90 transition-colors duration-200">
                            Collapse
                        </span>
                        {/* Inner glossy highlight */}
                        <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 60%)`,
                            }}
                        />
                    </motion.button>
                )}
                {/* ── Glassmorphism layers ─────────────────────────── */}
                <div
                    className={cn(
                        "absolute inset-0 transition-all duration-500",
                        isFront
                            ? "bg-[#0c0c10]/88 backdrop-blur-[26px] backdrop-brightness-[1.12] backdrop-saturate-[1.4]"
                            : "bg-[#08080a]/92 backdrop-blur-[40px] backdrop-brightness-[0.7] backdrop-saturate-[0.4]"
                    )}
                />

                {/* Inner light gradient for front card legibility */}
                {isFront && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent pointer-events-none" />
                )}

                {/* Noise texture overlay */}
                <div
                    className={cn(
                        "absolute inset-0 pointer-events-none",
                        isFront ? "opacity-[0.012]" : "opacity-[0.035]"
                    )}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                        backgroundSize: "128px",
                    }}
                />

                {/* Ambient glow at top for active card */}
                {isFront && (
                    <motion.div
                        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[65%] h-44 rounded-full blur-[70px] pointer-events-none"
                        animate={{ opacity: isExpanded ? 0.45 : 0.2 }}
                        transition={AMBIENT_SPRING}
                        style={{ backgroundColor: accentColor }}
                    />
                )}

                {/* Ambient glow beneath front card */}
                {isFront && (
                    <motion.div
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[50%] h-24 rounded-full blur-[50px] pointer-events-none"
                        animate={{ opacity: isExpanded ? 0.2 : 0.1 }}
                        transition={AMBIENT_SPRING}
                        style={{ backgroundColor: accentColor }}
                    />
                )}

                {/* ── Card Content — Strict 3-Section Grid ────── */}
                <div
                    className={cn(
                        "relative z-10 flex flex-col h-full",
                        // Uniform 32px padding all sides, all viewports
                        "p-8",
                        isExpanded && isFront && "overflow-y-auto"
                    )}
                    style={isExpanded && isFront ? {
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(255,255,255,0.12) transparent",
                    } : undefined}
                    onPointerDown={(e) => {
                        if (isExpanded && isFront) e.stopPropagation();
                    }}
                >

                    {/* ╔══════════════════════════════════════════╗
                        ║  SECTION 1: HEADER                     ║
                        ╚══════════════════════════════════════════╝ */}
                    <div className="mb-6"> {/* 24px below header section */}

                        {/* Row 1: Eyebrow micro-label + status badge (same baseline) */}
                        <div className="flex items-center justify-between mb-4"> {/* 16px below row */}
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{
                                        backgroundColor: accentColor,
                                        boxShadow: `0 0 10px ${accentColor}60`,
                                    }}
                                />
                                <span
                                    className="text-[10px] font-bold uppercase tracking-[0.3em] px-3 py-1 border rounded-full"
                                    style={{
                                        color: accentColor,
                                        borderColor: `${accentColor}25`,
                                        backgroundColor: `${accentColor}06`,
                                    }}
                                >
                                    {card.tag}
                                </span>
                            </div>

                            <span
                                className="text-[10px] font-bold uppercase tracking-[0.25em]"
                                style={{ color: `${accentColor}bb` }}
                            >
                                {severityLabel(card.severity)}
                            </span>
                        </div>

                        {/* Row 2: Primary Headline — directly under micro-label */}
                        <h3
                            className={cn(
                                "font-heading font-black uppercase leading-[1.08] transition-colors duration-300",
                                isFront
                                    ? "text-white text-[1.5rem] md:text-[1.85rem] lg:text-[2.1rem] tracking-[0.04em]"
                                    : "text-white/30 text-lg md:text-xl tracking-[0.03em]"
                            )}
                        >
                            {card.label}
                        </h3>

                        {/* Accent divider — flush left, consistent width */}
                        <div
                            className="h-[1.5px] w-16 rounded-full mt-3" /* 12px above */
                            style={{
                                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}20, transparent)`,
                            }}
                        />
                    </div>

                    {/* ╔══════════════════════════════════════════╗
                        ║  SECTION 2: BODY CONTENT                ║
                        ╚══════════════════════════════════════════╝ */}
                    <div className="mb-6 max-w-[92%]"> {/* 24px below, constrained width for readability */}

                        {/* Analytical body — single instance, clamp toggles on expand */}
                        <p
                            className={cn(
                                "text-[13px] leading-[1.6] transition-all duration-300",
                                isFront
                                    ? isExpanded
                                        ? "text-white/65"              /* expanded: full text, slightly muted */
                                        : "text-white/65 line-clamp-2" /* preview: 2 lines */
                                    : "text-white/20 line-clamp-1"     /* background cards: 1 line */
                            )}
                        >
                            {card.description}
                        </p>
                    </div>

                    {/* ╔══════════════════════════════════════════╗
                        ║  SECTION 3: EXPANDED DETAILS            ║
                        ╚══════════════════════════════════════════╝ */}
                    <AnimatePresence>
                        {isExpanded && isFront && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="flex flex-col gap-6" /* 24px between expanded sub-sections */
                            >
                                {/* Thin separator */}
                                <div className="h-px w-full bg-white/[0.06]" />

                                {/* Metrics grid — equal-width columns, equal-height cells */}
                                {card.metrics && card.metrics.length > 0 && (
                                    <div>
                                        <p
                                            className="text-[9px] uppercase tracking-[0.3em] font-bold mb-3"
                                            style={{ color: `${accentColor}90` }}
                                        >
                                            Diagnostic Metrics
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {card.metrics.slice(0, 4).map((m, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.04 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                                    className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 min-h-[64px] flex flex-col justify-between"
                                                >
                                                    <p className="text-[8px] text-white/35 uppercase tracking-[0.2em] font-bold truncate">
                                                        {m.label}
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            "text-[17px] font-heading font-black leading-none truncate mt-1",
                                                            m.warn ? "text-spider-red" : "text-white/90"
                                                        )}
                                                        title={m.value}
                                                    >
                                                        {m.value}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Key Observations */}
                                {card.bullets && card.bullets.length > 0 && (
                                    <div>
                                        <p
                                            className="text-[9px] uppercase tracking-[0.3em] font-bold mb-3"
                                            style={{ color: `${accentColor}90` }}
                                        >
                                            Key Observations
                                        </p>
                                        <div className="space-y-2">
                                            {card.bullets.slice(0, 4).map((b, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -4 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.05 * i, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                                    className="flex items-start gap-2"
                                                >
                                                    <span
                                                        className="text-[10px] mt-[3px] shrink-0 leading-none"
                                                        style={{ color: accentColor }}
                                                    >
                                                        ▸
                                                    </span>
                                                    <p className="text-white/55 text-[12px] font-mono leading-[1.6] max-w-[90%]">
                                                        {b}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Spacer — pushes footer to bottom */}
                    <div className="flex-1 min-h-4" /> {/* minimum 16px gap before footer */}

                    {/* ╔══════════════════════════════════════════╗
                        ║  SECTION 4: FOOTER — CONFIDENCE BAR     ║
                        ╚══════════════════════════════════════════╝ */}
                    <div className="pt-4 border-t border-white/[0.04]"> {/* 16px padding-top + subtle border */}
                        <div className="flex items-center justify-between mb-2"> {/* 8px below labels */}
                            <span
                                className={cn(
                                    "text-[8px] uppercase tracking-[0.25em] font-bold transition-colors duration-300",
                                    isFront ? "text-white/30" : "text-white/10"
                                )}
                            >
                                Confidence Index
                            </span>
                            <span className={cn(
                                "text-[11px] font-mono font-bold tabular-nums transition-colors duration-300",
                                isFront ? "text-white/65" : "text-white/12"
                            )}>
                                {(card.confidence * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: accentColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${card.confidence * 100}%` }}
                                transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            />
                        </div>
                    </div>

                    {/* Interaction hint — 16px above */}
                    {isFront && !isExpanded && !isAnyExpanded && (
                        <motion.p
                            className="mt-4 text-[8px] uppercase tracking-[0.35em] text-center"
                            style={{ color: `${accentColor}30` }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            Click to expand analysis
                        </motion.p>
                    )}
                </div>

                {/* Bottom edge glow */}
                {isFront && (
                    <div
                        className="absolute bottom-0 left-[8%] right-[8%] h-px opacity-50"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
                        }}
                    />
                )}
            </div>
        </motion.div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════
   Main Stack Component — Infinite Loop via Transform Reordering
   ═══════════════════════════════════════════════════════════════════════ */

export const FlipCardStack: React.FC<FlipCardStackProps> = ({ cards, className }) => {
    const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    React.useEffect(() => {
        setOrder(cards.map((_, i) => i));
    }, [cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Send front card to back (→ next)
    const sendToBack = useCallback(() => {
        setOrder((prev) => {
            const next = [...prev];
            const front = next.shift()!;
            next.push(front);
            return next;
        });
    }, []);

    // Bring back card to front (← previous)
    const bringToFront = useCallback(() => {
        setOrder((prev) => {
            const next = [...prev];
            const back = next.pop()!;
            next.unshift(back);
            return next;
        });
    }, []);

    // ── Arrow key navigation ────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (expandedCardId) return; // disabled while expanded
            if (e.key === "ArrowRight") {
                e.preventDefault();
                sendToBack();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                bringToFront();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [expandedCardId, sendToBack, bringToFront]);

    const handleExpand = useCallback((card: DatasetCard) => {
        setExpandedCardId(card.id);
    }, []);

    const handleCollapse = useCallback(() => {
        setExpandedCardId(null);
    }, []);

    if (!cards || cards.length === 0) return null;

    const activeCard = cards[order[0]];
    const activeColor = activeCard ? severityColor(activeCard.severity) : "#00F0FF";
    const isAnyExpanded = expandedCardId !== null;

    // Build lookup: cardIndex → stackPosition
    const positionMap = new Map<number, number>();
    order.forEach((cardIdx, stackPos) => positionMap.set(cardIdx, stackPos));

    return (
        <motion.div
            className={cn("relative w-full flex flex-col items-center", className)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* ── Ambient Background Glow ──────────────────────────── */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[130px] pointer-events-none"
                animate={{
                    opacity: isAnyExpanded ? 0.14 : 0.06,
                    scale: isAnyExpanded ? 1.25 : 1,
                    backgroundColor: activeColor,
                }}
                transition={AMBIENT_SPRING}
            />

            {/* ── Expanded backdrop dim ────────────────────────────── */}
            <AnimatePresence>
                {isAnyExpanded && (
                    <motion.div
                        className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[3px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        onClick={handleCollapse}
                    />
                )}
            </AnimatePresence>

            {/* ── Stack Container ──────────────────────────────────── */}
            <div
                className={cn(
                    "relative w-full max-w-[740px] aspect-[4/3] md:aspect-[16/10]",
                    isAnyExpanded && "z-[70]"
                )}
            >
                {cards.map((card, cardIndex) => {
                    const stackPosition = positionMap.get(cardIndex) ?? cardIndex;
                    return (
                        <StackCard
                            key={card.id}
                            card={card}
                            stackIndex={stackPosition}
                            total={cards.length}
                            isExpanded={expandedCardId === card.id}
                            isAnyExpanded={isAnyExpanded}
                            onSendToBack={sendToBack}
                            onExpand={() => handleExpand(card)}
                            onCollapse={handleCollapse}
                        />
                    );
                })}
            </div>

            {/* ── Card Counter ─────────────────────────────────────── */}
            <motion.div
                className="mt-10 flex items-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isAnyExpanded ? 0.25 : 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-center gap-2">
                    {cards.map((c, i) => (
                        <motion.div
                            key={c.id}
                            className="rounded-full"
                            animate={{
                                width: order[0] === i ? 22 : 6,
                                height: 6,
                                backgroundColor: order[0] === i ? activeColor : "rgba(255,255,255,0.12)",
                                boxShadow: order[0] === i ? `0 0 10px ${activeColor}50` : "none",
                            }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        />
                    ))}
                </div>

                <span className="text-[10px] text-dim/40 uppercase tracking-[0.3em] font-bold">
                    {order[0] + 1} / {cards.length}
                </span>
            </motion.div>

            {/* ── Navigation Hint ─────────────────────────────────── */}
            <motion.div
                className="mt-4 flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: isAnyExpanded ? 0 : 0.8 }}
                transition={{ delay: 1, duration: 0.4 }}
            >
                {/* Left arrow key */}
                <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm cursor-pointer hover:bg-white/[0.08] transition-all duration-200 active:scale-95"
                    onClick={bringToFront}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50" />
                    </svg>
                    <span className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-bold">Prev</span>
                </div>

                <span
                    className="text-[9px] uppercase tracking-[0.4em]"
                    style={{ color: `${activeColor}45` }}
                >
                    Use arrow keys
                </span>

                {/* Right arrow key */}
                <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm cursor-pointer hover:bg-white/[0.08] transition-all duration-200 active:scale-95"
                    onClick={sendToBack}
                >
                    <span className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-bold">Next</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50" />
                    </svg>
                </div>
            </motion.div>
        </motion.div>
    );
};
