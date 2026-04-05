import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/store/analysisStore";
import { generateInsightBlocks, type InsightBlock } from "@/engine/data/InsightGenerator";

import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { AIInsightsPanel } from "@/components/insights/AIInsightsPanel";
import { ChartLightbox } from "@/components/insights/ChartLightbox";
import { GlitchWrapper } from "@/components/GlitchWrapper";
import { ChromaticText } from "@/components/ui/ChromaticText";
import { GlitchText } from "@/engine/text/GlitchText";
import { DepthTypography } from "@/engine/DepthTypography";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Shield, Link as LinkIcon, BarChart3, Target,
    Brain, AlertTriangle, ShieldAlert, Upload, Expand,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
    Shield, Link: LinkIcon, BarChart3, Target,
    Brain, AlertTriangle, ShieldAlert,
};

// ── Helper Components ─────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: InsightBlock['severity'] }) {
    const styles = {
        success: "text-green-400 border-green-400/30 bg-green-400/10",
        info: "text-cyan border-cyan/30 bg-cyan/10",
        warning: "text-amber-400 border-amber-400/30 bg-amber-400/10",
        danger: "text-spider-red border-spider-red/30 bg-spider-red/10",
    };
    return (
        <span className={cn("text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 border", styles[severity])}>
            {severity}
        </span>
    );
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#ef4444";

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth={4} strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-heading font-black text-sm italic">{score}</span>
            </div>
        </div>
    );
}

// ── Bento Insight Card ────────────────────────────────────────────────

function BentoInsightCard({
    block,
    index,
    span = "1x1",
}: {
    block: InsightBlock;
    index: number;
    span?: "1x1" | "2x1" | "1x2" | "2x2";
}) {
    const IconComponent = ICON_MAP[block.icon] ?? Shield;

    const spanClass = {
        "1x1": "",
        "2x1": "lg:col-span-2",
        "1x2": "lg:row-span-2",
        "2x2": "lg:col-span-2 lg:row-span-2",
    }[span];

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className={cn(
                "bg-black border border-white/[0.06] rounded-xl p-6 transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-spider-red/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
                "group",
                block.severity === "danger" && "border-l-2 border-l-spider-red",
                block.severity === "warning" && "border-l-2 border-l-amber-400",
                block.severity === "success" && "border-l-2 border-l-green-400",
                spanClass,
                span === "1x2" && "flex flex-col justify-between",
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-spider-red/10 border border-spider-red/20 rounded-lg">
                        <IconComponent size={16} className="text-spider-red" />
                    </div>
                    <div>
                        <h3 className="text-white font-heading font-bold text-base uppercase tracking-wider group-hover:text-spider-red transition-colors">
                            {block.title}
                        </h3>
                        <SeverityBadge severity={block.severity} />
                    </div>
                </div>
                {block.score !== undefined && <ScoreRing score={block.score} />}
            </div>

            {/* Summary */}
            <p className="text-dim/80 font-mono text-[13px] leading-relaxed mb-5">
                {block.summary}
            </p>

            {/* Details */}
            {block.details.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[9px] text-spider-red/50 uppercase tracking-[0.4em] font-bold mb-2">
                        Details
                    </p>
                    {block.details.slice(0, span === "2x1" || span === "1x2" ? 6 : 3).map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <span className="text-spider-red/40 text-xs mt-0.5">▸</span>
                            <p className="text-dim/60 text-xs font-mono leading-relaxed">{d}</p>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ── Bento Chart Card ──────────────────────────────────────────────────

function BentoChartCard({
    config,
    label,
    index,
    span = "1x1",
    onExpand,
}: {
    config: any;
    label: string;
    index: number;
    span?: "1x1" | "2x1" | "1x2";
    onExpand: () => void;
}) {
    const spanClass = {
        "1x1": "",
        "2x1": "lg:col-span-2",
        "1x2": "lg:row-span-2",
    }[span];

    const chartHeight = span === "2x1" ? "min-h-[380px]" : "min-h-[320px]";

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className={cn(
                "bg-black border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
                "group relative flex flex-col",
                spanClass,
            )}
        >
            {/* Expand button */}
            <button
                onClick={onExpand}
                className="absolute top-3 right-3 z-10 p-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:border-white/20"
            >
                <Expand size={14} className="text-white" />
            </button>

            {/* Header */}
            <div className="px-6 pt-5 pb-3 border-b border-white/[0.04]">
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-dim">
                    {label}
                </span>
                <h3 className="text-xs font-heading font-bold text-white tracking-[0.15em] uppercase mt-1">
                    {config.title}
                </h3>
            </div>

            {/* Chart — rendered directly, no ChartCard wrapper */}
            <div className={cn("flex-1 p-6 flex items-center justify-center bg-[#050505]", chartHeight)}>
                <ChartRenderer config={config} />
            </div>
        </motion.div>
    );
}

// ── Bento Observation Card ────────────────────────────────────────────

function BentoObservationCard({ insight, index }: { insight: any; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            className={cn(
                "bg-black border border-white/[0.06] rounded-xl p-5 transition-all duration-200",
                "hover:-translate-y-0.5 hover:border-white/10",
                "flex items-start gap-4",
            )}
        >
            <div
                className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                    insight.type === "danger" ? "bg-spider-red shadow-[0_0_8px_#B11226]"
                        : insight.type === "warning" ? "bg-amber-400 shadow-[0_0_8px_#F59E0B]"
                            : insight.type === "purple" ? "bg-purple-500 shadow-[0_0_8px_#8B5CF6]"
                                : "bg-cyan shadow-[0_0_8px_#00F0FF]"
                )}
            />
            <div className="flex-1 min-w-0">
                <span
                    className={cn(
                        "text-[8px] font-bold uppercase tracking-[0.3em] px-2 py-0.5 border rounded inline-block mb-2",
                        insight.type === "danger" ? "text-spider-red border-spider-red/20"
                            : insight.type === "warning" ? "text-amber-400 border-amber-400/20"
                                : insight.type === "purple" ? "text-purple-400 border-purple-400/20"
                                    : "text-cyan border-cyan/20"
                    )}
                >
                    {insight.tag}
                </span>
                <p className="text-dim/80 text-xs font-mono leading-relaxed">{insight.message}</p>
            </div>
        </motion.div>
    );
}

// ── Section Header ────────────────────────────────────────────────────

function SectionHeader({ color, title }: { color: string; title: string }) {
    return (
        <div className="flex items-center gap-4 mb-6">
            <div className={`w-1.5 h-7 rounded-full ${color}`} />
            <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                <ChromaticText text={title} intensity={8} as="span" />
            </h2>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function InsightsPage() {
    const { analysisData } = useAnalysisStore();
    const blocks = useMemo(() => generateInsightBlocks(analysisData), [analysisData]);
    const [lightboxChart, setLightboxChart] = useState<any>(null);

    const chartConfigs = analysisData?.chart_configs ?? [];
    const heatmapChart = chartConfigs.find((c: any) => c.type === "heatmap");
    const histogramCharts = chartConfigs.filter((c: any) => c.type === "histogram").slice(0, 4);
    const scatterCharts = chartConfigs.filter((c: any) => c.type === "scatter").slice(0, 2);

    // ── Assign span strategy: ~30% of items get a span ──
    const getInsightSpan = (block: InsightBlock, i: number): "1x1" | "2x1" | "1x2" => {
        if (block.severity === "danger" && block.score !== undefined && block.score < 60) return "2x1";
        if (i === 0 && blocks.length >= 3) return "2x1"; // First block always prominent
        if (block.details.length > 4) return "1x2";
        return "1x1";
    };

    // ── Empty State ──
    if (!analysisData) {
        return (
            <main className="min-h-screen bg-void pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 flex items-center justify-center px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-spider-shadow bg-black/30 rounded-xl p-16 text-center max-w-2xl"
                >
                    <Upload size={48} className="mx-auto text-spider-red/30 mb-8" />
                    <h2 className="text-white font-heading font-bold text-2xl uppercase tracking-wider mb-4">
                        <GlitchText>No Analysis Data</GlitchText>
                    </h2>
                    <p className="text-dim text-sm uppercase tracking-widest mb-8 opacity-50">
                        Upload a CSV file to generate dynamic insights
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 bg-spider-red text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-lg hover:bg-spider-red/80 transition-colors"
                    >
                        Go to Upload
                    </Link>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-void pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20">
            {/* Chart Lightbox */}
            <ChartLightbox
                isOpen={!!lightboxChart}
                onClose={() => setLightboxChart(null)}
                title={lightboxChart?.title}
            >
                {lightboxChart && <ChartRenderer config={lightboxChart} />}
            </ChartLightbox>

            {/* Hero */}
            <section className="text-center mb-10 sm:mb-16 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-block px-4 py-1 bg-spider-red/10 border border-spider-red/20 text-spider-red text-[10px] font-bold uppercase tracking-[0.4em] mb-6 rounded-full">
                        <ChromaticText text={`${analysisData.columns} Dimensions Analyzed`} intensity={5} />
                    </div>

                    <GlitchWrapper trigger="always" className="mb-4">
                        <DepthTypography as="h1" depth="lg" className="text-5xl md:text-7xl">
                            Insights
                        </DepthTypography>
                    </GlitchWrapper>

                    <p className="text-dim max-w-2xl mx-auto text-[11px] font-bold uppercase tracking-[0.4em] opacity-50">
                        AI-powered pattern detection across {analysisData.rows?.toLocaleString()} records
                    </p>
                </motion.div>
            </section>

            <div className="flex gap-4 sm:gap-6 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* ── Main Content ───────────────────────────────── */}
                <div className="flex-1 min-w-0 space-y-14">

                    {/* ── Intelligence Report — Bento Grid ──────── */}
                    {blocks.length > 0 && (
                        <section>
                            <SectionHeader color="bg-spider-red" title="Intelligence Report" />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {blocks.map((block, i) => (
                                    <BentoInsightCard
                                        key={block.id}
                                        block={block}
                                        index={i}
                                        span={getInsightSpan(block, i)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Charts — Bento Grid ──────────────────── */}
                    {(heatmapChart || histogramCharts.length > 0 || scatterCharts.length > 0) && (
                        <section>
                            <SectionHeader color="bg-cyan" title="Visual Analysis" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Heatmap — full width in 2-col layout */}
                                {heatmapChart && (
                                    <BentoChartCard
                                        config={heatmapChart}
                                        label="Correlation Heatmap"
                                        index={0}
                                        span="2x1"
                                        onExpand={() => setLightboxChart(heatmapChart)}
                                    />
                                )}

                                {/* Histograms */}
                                {histogramCharts.map((config: any, i: number) => (
                                    <BentoChartCard
                                        key={`hist-${i}`}
                                        config={config}
                                        label="Distribution"
                                        index={i + 1}
                                        span="1x1"
                                        onExpand={() => setLightboxChart(config)}
                                    />
                                ))}

                                {/* Scatter Plots */}
                                {scatterCharts.map((config: any, i: number) => (
                                    <BentoChartCard
                                        key={`scatter-${i}`}
                                        config={config}
                                        label="Correlation"
                                        index={i + histogramCharts.length + 1}
                                        span="1x1"
                                        onExpand={() => setLightboxChart(config)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── AI Observations — Bento Grid ─────────── */}
                    {analysisData.insights && analysisData.insights.length > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-1.5 h-7 rounded-full bg-spider-red" />
                                <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                                    <ChromaticText text="AI Observations" intensity={8} as="span" />
                                </h2>
                                <span className="text-[9px] text-dim/40 uppercase tracking-[0.3em]">
                                    {analysisData.insights.length} detected
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {analysisData.insights.map((insight: any, i: number) => (
                                    <BentoObservationCard key={i} insight={insight} index={i} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* ── AI Panel — Right Sidebar ──────────────────── */}
                <div className="hidden lg:block flex-shrink-0 w-80">
                    <div className="sticky top-36">
                        <AIInsightsPanel />
                    </div>
                </div>
            </div>
        </main>
    );
}
