import React, { useEffect, useRef, useState } from 'react';
import { WebGLCarousel, CarouselItemData } from '@/engine/carousel/WebGLCarousel';
import { cn } from '@/lib/utils';
import type { DatasetCard } from '@/engine/data/DatasetAnalyzer';

interface DataCarouselProps {
    className?: string;
    scrollMode?: 'carousel' | 'immersive';
    items?: DatasetCard[];
}

export const DataCarousel: React.FC<DataCarouselProps> = ({ className, scrollMode = 'carousel', items }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<WebGLCarousel | null>(null);
    const [selectedItem, setSelectedItem] = useState<DatasetCard | null>(null);

    // Convert DatasetCards → CarouselItemData for the WebGL engine
    const carouselData: CarouselItemData[] = (items ?? []).map(card => ({
        id: card.id,
        label: card.label,
        description: card.description,
    }));

    useEffect(() => {
        if (!containerRef.current || carouselData.length === 0) return;

        const handleItemClick = (id: string) => {
            const card = items?.find(d => d.id === id);
            if (card) setSelectedItem(card);
        };

        engineRef.current = new WebGLCarousel(containerRef.current, carouselData, handleItemClick);
        engineRef.current.setMode(scrollMode);

        return () => {
            if (engineRef.current) {
                engineRef.current.dispose();
                engineRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.setMode(scrollMode);
        }
    }, [scrollMode]);

    return (
        <div className={cn("relative w-full h-[600px] bg-black/50 overflow-hidden font-sans", className)}>
            <div className="absolute top-4 left-6 z-10 pointer-events-none">
                <h3 className="text-white font-heading font-black text-xl italic uppercase tracking-widest">
                    Data<span className="text-spider-red">Intelligence</span>
                </h3>
                <p className="text-[10px] text-dim uppercase tracking-[0.4em] font-mono">
                    Interactive 3D Engine
                </p>
            </div>

            {/* WebGL Container */}
            <div ref={containerRef} className="w-full h-full relative z-0" />

            {/* Empty state */}
            {(!items || items.length === 0) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <p className="text-dim text-sm uppercase tracking-[0.3em] font-bold">No dataset loaded</p>
                        <p className="text-dim/50 text-[10px] uppercase tracking-[0.4em]">Upload a CSV to generate intelligence cards</p>
                    </div>
                </div>
            )}

            {/* Detail Overlay */}
            {selectedItem && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-8" onClick={() => setSelectedItem(null)}>
                    <div className="bg-void border border-spider-red/30 p-8 max-w-2xl w-full relative cursor-auto overflow-y-auto max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                        <button className="absolute top-4 right-4 text-dim hover:text-white transition-colors" onClick={() => setSelectedItem(null)}>
                            ✕
                        </button>

                        {/* Tag */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 border",
                                selectedItem.severity >= 2
                                    ? "text-spider-red border-spider-red/30 bg-spider-red/10"
                                    : selectedItem.severity === 1
                                        ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                                        : "text-cyan border-cyan/30 bg-cyan/10"
                            )}>
                                {selectedItem.tag}
                            </span>
                            {selectedItem.confidence !== undefined && (
                                <span className="text-[9px] text-dim/50 uppercase tracking-[0.2em]">
                                    {(selectedItem.confidence * 100).toFixed(0)}% conf
                                </span>
                            )}
                        </div>

                        <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-wider">{selectedItem.label}</h2>
                        <div className="h-0.5 w-full bg-gradient-to-r from-spider-red to-transparent mb-6" />

                        <p className="text-dim font-mono text-sm leading-relaxed mb-6">
                            {selectedItem.description}
                        </p>

                        {/* Metrics Grid */}
                        {selectedItem.metrics && selectedItem.metrics.length > 0 && (
                            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))` }}>
                                {selectedItem.metrics.map((m, i) => (
                                    <div key={i} className="bg-black/50 border border-spider-shadow p-3 overflow-hidden">
                                        <p className="text-[8px] text-dim uppercase tracking-[0.3em] font-black mb-1">{m.label}</p>
                                        <p className={cn("text-sm font-heading font-black italic truncate", m.warn ? "text-spider-red" : "text-white")} title={m.value}>{m.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bullet Insights */}
                        {selectedItem.bullets && selectedItem.bullets.length > 0 && (
                            <div className="space-y-2 mb-6">
                                <p className="text-[9px] text-spider-red uppercase tracking-[0.4em] font-black mb-3">// KEY OBSERVATIONS</p>
                                {selectedItem.bullets.map((b, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="text-spider-red text-xs mt-0.5">▸</span>
                                        <p className="text-dim/80 text-xs font-mono leading-relaxed">{b}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex gap-4">
                            <button className="px-6 py-2 border border-dim text-dim font-bold uppercase tracking-widest text-xs hover:text-white hover:border-white transition-colors" onClick={() => setSelectedItem(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer hint */}
            {items && items.length > 0 && (
                <div className="absolute bottom-6 w-full text-center pointer-events-none">
                    <p className="text-[9px] text-spider-red/50 uppercase tracking-[0.5em] animate-pulse">
                        Swipe to Rotate · Click to Inspect
                    </p>
                </div>
            )}
        </div>
    );
};
