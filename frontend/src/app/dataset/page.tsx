import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysisStore";
import { FlipCardStack } from "@/components/carousel/FlipCardStack";
import { analyzeDataset } from "@/engine/data/DatasetAnalyzer";
import { GlitchWrapper } from "@/components/GlitchWrapper";
import { DepthTypography } from "@/engine/DepthTypography";
import { ChromaticText } from "@/components/ui/ChromaticText";
import { GlitchText } from "@/engine/text/GlitchText";
import Link from "next/link";
import { Database, Upload } from "lucide-react";

export default function DatasetPage() {
    const { analysisData, _hasHydrated } = useAnalysisStore();

    const cards = useMemo(() => analyzeDataset(analysisData), [analysisData]);

    // Wait for sessionStorage rehydration before deciding what to render
    if (!_hasHydrated) {
        return (
            <main className="dataset-loading">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-white/[0.06] border-t-spider-red rounded-full animate-spin" />
                    <p className="dataset-loading-copy">
                        Restoring dataset
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="dataset-root">
            {/* Hero */}
            <section className="dataset-hero">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="dataset-hero-badge px-4 py-1 mb-8">
                        <ChromaticText text="Dataset Intelligence Engine v1.0" intensity={5} />
                    </div>

                    <GlitchWrapper trigger="always" className="mb-6 block">
                        <DepthTypography as="h1" depth="xl" className="dataset-hero-title">
                            Dataset
                        </DepthTypography>
                    </GlitchWrapper>

                    <p className="dataset-hero-summary">
                        {analysisData
                            ? `Analyzing '${analysisData.filename}' ${analysisData.problem_statement ? `for '${analysisData.problem_statement}' ` : ''}— ${analysisData.rows?.toLocaleString()} records × ${analysisData.columns} features`
                            : "Upload a dataset to unlock intelligence cards"
                        }
                    </p>

                    {analysisData && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="dataset-meta-row"
                        >
                            <div className="dataset-meta-item">
                                <Database size={12} className="text-spider-red" />
                                Health: <span className={analysisData.health_score >= 70 ? "text-green-400" : "text-spider-red"}>{analysisData.health_score}/100</span>
                            </div>
                            <div className="dataset-meta-item">
                                Session: {analysisData.session_id?.slice(0, 8).toUpperCase()}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* Flip Card Stack */}
            {analysisData ? (
                <section className="dataset-stack-shell">
                    {/* Premium background glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="dataset-glow" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <FlipCardStack cards={cards} />
                    </motion.div>

                    {/* Card Legend */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-12 flex flex-wrap justify-center gap-6 text-[9px] uppercase tracking-[0.3em]"
                    >
                        {cards.map((card) => (
                            <div key={card.id} className="flex items-center gap-2 text-dim/50">
                                <span className={
                                    card.severity >= 2 ? "w-2 h-2 bg-spider-red shadow-[0_0_6px_#B11226] rounded-full" :
                                        card.severity === 1 ? "w-2 h-2 bg-amber-400 shadow-[0_0_6px_#F59E0B] rounded-full" :
                                            "w-2 h-2 bg-cyan shadow-[0_0_6px_#00F0FF] rounded-full"
                                } />
                                {card.label}
                            </div>
                        ))}
                    </motion.div>
                </section>
            ) : (
                /* Empty State — Upload CTA */
                <section className="dataset-empty-shell">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="dataset-empty-card"
                    >
                        <Upload size={48} className="mx-auto text-spider-red/30 mb-8" />
                        <h2 className="text-white font-heading font-black text-2xl italic uppercase tracking-wider mb-4">
                            <GlitchText intensity="low">No Dataset Loaded</GlitchText>
                        </h2>
                        <p className="text-dim text-sm uppercase tracking-widest mb-8 opacity-50">
                            Upload a CSV file to generate dynamic intelligence cards
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-8 py-3 bg-spider-red text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-spider-red/80 transition-colors"
                        >
                            Go to Upload
                        </Link>
                    </motion.div>
                </section>
            )}

        </main>
    );
}
