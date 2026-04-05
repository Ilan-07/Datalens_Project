import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { insightEngine } from '@/engine/ai/InsightEngine';
import type { AnalysisResult } from '@/engine/ai/PatternAnalyzer';

const TYPE_COLORS: Record<AnalysisResult['type'], { border: string; text: string; bg: string; label: string }> = {
    correlation: { border: 'border-cyan/30', text: 'text-cyan', bg: 'bg-cyan/5', label: 'CORRELATION' },
    warning: { border: 'border-yellow-500/30', text: 'text-yellow-500', bg: 'bg-yellow-500/5', label: 'WARNING' },
    observation: { border: 'border-[#A855F7]/30', text: 'text-[#A855F7]', bg: 'bg-[#A855F7]/5', label: 'OBSERVATION' },
    recommendation: { border: 'border-green-500/30', text: 'text-green-500', bg: 'bg-green-500/5', label: 'RECOMMEND' },
};

export const AIInsightsPanel = () => {
    const [insights, setInsights] = useState<AnalysisResult[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        insightEngine.init();
        setInsights([...insightEngine.getInsights()]);

        const unsub = insightEngine.subscribe((newInsights) => {
            setInsights([...newInsights]);
        });

        return () => {
            unsub();
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-80"
        >
            {/* Header */}
            <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-full flex items-center justify-between px-4 py-3 bg-black/95 border border-cyan/30 backdrop-blur-md cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan">
                        System Intelligence
                    </span>
                </div>
                <span className="text-dim text-xs">{isMinimized ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-black/95 border border-t-0 border-cyan/20 backdrop-blur-md"
                    >
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                                {insights.map((insight, i) => {
                                    const style = TYPE_COLORS[insight.type];
                                    return (
                                        <motion.div
                                            key={insight.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ delay: i * 0.1, duration: 0.3 }}
                                            className={`p-3 border ${style.border} ${style.bg}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${style.text}`}>
                                                    {style.label}
                                                </span>
                                                <span className="text-[8px] text-dim font-mono">
                                                    {(insight.confidence * 100).toFixed(0)}% conf
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted leading-relaxed">
                                                {insight.message}
                                            </p>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {insights.length === 0 && (
                                <div className="text-center py-6">
                                    <p className="text-[10px] text-dim uppercase tracking-widest">
                                        Collecting data...
                                    </p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="pt-2 border-t border-white/5">
                                <p className="text-[8px] text-dim/50 font-mono uppercase tracking-wider text-center">
                                    Refreshes every 5s • Heuristic Analysis
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
