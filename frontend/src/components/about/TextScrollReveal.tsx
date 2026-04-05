/**
 * TextScrollReveal — Scroll-Linked Line-by-Line Reveal
 * =====================================================
 * Paragraph reveals progressively as user scrolls.
 * Each line fades in + slides up. Framer-inspired, native implementation.
 */

import React, { useRef, useEffect, useState, useMemo } from "react";

interface TextScrollRevealProps {
    /** The full text to reveal */
    text: string;
    /** Optional className for the container */
    className?: string;
    /** Words per "line" chunk (default 8) */
    wordsPerChunk?: number;
}

export const TextScrollReveal: React.FC<TextScrollRevealProps> = ({
    text,
    className,
    wordsPerChunk = 8,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);

    // Split text into word chunks
    const chunks = useMemo(() => {
        const words = text.split(/\s+/);
        const result: string[] = [];
        for (let i = 0; i < words.length; i += wordsPerChunk) {
            result.push(words.slice(i, i + wordsPerChunk).join(" "));
        }
        return result;
    }, [text, wordsPerChunk]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onScroll = () => {
            const rect = el.getBoundingClientRect();
            const viewH = window.innerHeight;

            // Track how much of the element has scrolled through the viewport.
            // Start: element top enters 90% from viewport top.
            // End: element bottom reaches 55% from viewport top.
            // This ensures the last chunks fully reveal before running out of scroll.
            const start = viewH * 0.9;
            const end = viewH * 0.55;
            const anchor = rect.top + rect.height * 0.5; // use midpoint for smoother feel

            const raw = (start - anchor) / (start - end);
            setProgress(Math.max(0, Math.min(1, raw)));
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // Initial check

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div ref={containerRef} className={className}>
            {chunks.map((chunk, i) => {
                const chunkStart = i / chunks.length;
                const chunkEnd = (i + 2) / chunks.length; // wider reveal window per chunk
                const chunkProgress = Math.max(0, Math.min(1, (progress - chunkStart) / (chunkEnd - chunkStart)));

                const opacity = chunkProgress;
                const translateY = (1 - chunkProgress) * 10; // 10px upward motion

                return (
                    <span
                        key={i}
                        style={{
                            display: "inline",
                            opacity,
                            transform: `translateY(${translateY}px)`,
                            transition: "opacity 0.1s ease, transform 0.1s ease",
                            willChange: "opacity, transform",
                        }}
                    >
                        {chunk}{" "}
                    </span>
                );
            })}
        </div>
    );
};
