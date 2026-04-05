import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysisStore } from "@/store/analysisStore";
import {
    trainModel,
    getTrainingHistory,
    type TrainingHistoryItem,
} from "@/services/analysisService";
import { GlitchWrapper } from "@/components/GlitchWrapper";
import { ChromaticText } from "@/components/ui/ChromaticText";
import { DepthTypography } from "@/engine/DepthTypography";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import {
    Brain,
    Play,
    Upload,
    Activity,
    Target,
    Zap,
    Database,
    TrendingUp,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface TrainingResult {
    status: string;
    problem_type: string;
    model_trained: string;
    test_size: number;
    train_size: number;
    metrics: Record<string, number>;
    feature_importances?: { feature: string; importance: number }[];
    class_labels?: string[];
    cluster_sizes?: Record<string, number>;
    target_column?: string;
    training_id?: string;
    session_id?: string;
    dataset_name?: string;
}

// ── Metric display helpers ───────────────────────────────────────────

const METRIC_META: Record<string, { label: string; icon: React.ReactNode; format: (v: number) => string; good: (v: number) => boolean }> = {
    accuracy: { label: "Accuracy", icon: <Target size={14} />, format: (v) => `${(v * 100).toFixed(1)}%`, good: (v) => v >= 0.8 },
    f1_score: { label: "F1 Score", icon: <Zap size={14} />, format: (v) => `${(v * 100).toFixed(1)}%`, good: (v) => v >= 0.75 },
    precision: { label: "Precision", icon: <Activity size={14} />, format: (v) => `${(v * 100).toFixed(1)}%`, good: (v) => v >= 0.75 },
    recall: { label: "Recall", icon: <Database size={14} />, format: (v) => `${(v * 100).toFixed(1)}%`, good: (v) => v >= 0.75 },
    r2_score: { label: "R² Score", icon: <TrendingUp size={14} />, format: (v) => v.toFixed(4), good: (v) => v >= 0.7 },
    mae: { label: "MAE", icon: <BarChart3 size={14} />, format: (v) => v.toFixed(4), good: () => true },
    rmse: { label: "RMSE", icon: <Activity size={14} />, format: (v) => v.toFixed(4), good: () => true },
    silhouette_score: { label: "Silhouette", icon: <Target size={14} />, format: (v) => v.toFixed(4), good: (v) => v >= 0.4 },
    inertia: { label: "Inertia", icon: <Zap size={14} />, format: (v) => v.toLocaleString(), good: () => true },
    n_clusters: { label: "Clusters", icon: <Database size={14} />, format: (v) => String(v), good: () => true },
};

const problemTypeStyles: Record<string, { color: string; bg: string; border: string; label: string }> = {
    regression: { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", label: "Regression" },
    classification: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Classification" },
    clustering: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Clustering" },
};

// ── Feature Importance Bar ───────────────────────────────────────────

function ImportanceBar({ feature, importance, maxImportance, index }: {
    feature: string;
    importance: number;
    maxImportance: number;
    index: number;
}) {
    const pct = maxImportance > 0 ? (importance / maxImportance) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex items-center gap-3"
        >
            <span className="text-xs text-white/50 font-mono w-32 truncate flex-shrink-0 text-right">
                {feature}
            </span>
            <div className="flex-1 h-5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.04]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-gradient-to-r from-spider-red/60 to-spider-red/30 rounded-full"
                />
            </div>
            <span className="text-xs text-white/40 font-mono w-14 text-right tabular-nums">
                {(importance * 100).toFixed(1)}%
            </span>
        </motion.div>
    );
}

// ── History Card ─────────────────────────────────────────────────────

function HistoryCard({ item, index }: { item: TrainingHistoryItem; index: number }) {
    const style = problemTypeStyles[item.problem_type || "regression"];
    const mainMetric = item.metrics
        ? Object.entries(item.metrics).find(([k]) => k === "accuracy" || k === "r2_score" || k === "silhouette_score")
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-black border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-200 hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                        {item.model_trained || "Unknown Model"}
                    </p>
                    <p className="text-white/30 text-xs truncate mt-0.5">
                        {item.dataset_name || "Unknown dataset"}
                    </p>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium flex-shrink-0",
                    style.bg, style.border, style.color, "border"
                )}>
                    {style.label}
                </div>
            </div>

            {mainMetric && (
                <div className="flex items-center gap-2 mt-3">
                    <span className="text-white/40 text-xs">
                        {METRIC_META[mainMetric[0]]?.label || mainMetric[0]}:
                    </span>
                    <span className="text-white font-mono text-sm font-semibold tabular-nums">
                        {METRIC_META[mainMetric[0]]?.format(mainMetric[1]) || mainMetric[1]}
                    </span>
                </div>
            )}

            {item.created_at && (
                <div className="flex items-center gap-1.5 mt-3 text-white/20 text-xs">
                    <Clock size={10} />
                    {new Date(item.created_at).toLocaleDateString()}
                </div>
            )}
        </motion.div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function TrainingPage() {
    const { analysisData } = useAnalysisStore();
    const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<TrainingHistoryItem[]>([]);

    const mlRec = analysisData?.ml_recommendation;
    const sessionId = analysisData?.session_id;

    useEffect(() => {
        getTrainingHistory()
            .then(setHistory)
            .catch(() => {});
    }, [trainingResult]);

    const handleTrain = async () => {
        if (!sessionId) return;
        setIsTraining(true);
        setError(null);
        setTrainingResult(null);

        try {
            const result = await trainModel(sessionId);
            setTrainingResult(result);
            toast.success("Model trained successfully");
        } catch (err: any) {
            const msg = err?.response?.data?.error?.message || "Training failed. Please try again.";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsTraining(false);
        }
    };

    // ── Empty state ──
    if (!analysisData || !mlRec) {
        return (
            <main className="min-h-screen bg-void pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
                {/* Show history even without active analysis */}
                {history.length > 0 ? (
                    <div className="max-w-[1200px] mx-auto">
                        <section className="text-center mb-10 sm:mb-16">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                                <GlitchWrapper trigger="always" className="mb-4">
                                    <DepthTypography as="h1" depth="lg" className="text-5xl md:text-7xl">
                                        Training Lab
                                    </DepthTypography>
                                </GlitchWrapper>
                                <p className="text-dim max-w-2xl mx-auto text-[11px] font-bold uppercase tracking-[0.4em] opacity-50">
                                    Past model training results
                                </p>
                            </motion.div>
                        </section>

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-1.5 h-7 rounded-full bg-spider-red" />
                                <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                                    <ChromaticText text="Training History" intensity={8} as="span" />
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {history.map((item, i) => (
                                    <HistoryCard key={item.id} item={item} index={i} />
                                ))}
                            </div>
                        </section>

                        <div className="text-center mt-12">
                            <Link
                                href="/dataset"
                                className="inline-block px-8 py-3 bg-spider-red text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-lg hover:bg-spider-red/80 transition-colors"
                            >
                                Upload New Dataset
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="border border-spider-shadow bg-black/30 rounded-xl p-16 text-center max-w-2xl"
                        >
                            <Upload size={48} className="mx-auto text-spider-red/30 mb-8" />
                            <h2 className="text-white font-heading font-bold text-2xl uppercase tracking-wider mb-4">
                                No Analysis Data
                            </h2>
                            <p className="text-dim text-sm uppercase tracking-widest mb-8 opacity-50">
                                Upload a CSV and run analysis to train models
                            </p>
                            <Link
                                href="/dataset"
                                className="inline-block px-8 py-3 bg-spider-red text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-lg hover:bg-spider-red/80 transition-colors"
                            >
                                Go to Upload
                            </Link>
                        </motion.div>
                    </div>
                )}
            </main>
        );
    }

    const style = problemTypeStyles[mlRec.problem_type] || problemTypeStyles.regression;

    return (
        <main className="min-h-screen bg-void pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20">
            {/* Hero */}
            <section className="text-center mb-10 sm:mb-16 px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div className="inline-block px-4 py-1 bg-spider-red/10 border border-spider-red/20 text-spider-red text-[10px] font-bold uppercase tracking-[0.4em] mb-6 rounded-full">
                        <ChromaticText text="Model Training Engine" intensity={5} />
                    </div>

                    <GlitchWrapper trigger="always" className="mb-4">
                        <DepthTypography as="h1" depth="lg" className="text-5xl md:text-7xl">
                            Training Lab
                        </DepthTypography>
                    </GlitchWrapper>

                    <p className="text-dim max-w-2xl mx-auto text-[11px] font-bold uppercase tracking-[0.4em] opacity-50">
                        Train the recommended model on your dataset
                    </p>
                </motion.div>
            </section>

            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                {/* ── Train Action Card ───────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black border border-white/[0.06] rounded-xl overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-spider-red/10 border border-spider-red/20 rounded-lg">
                                <Brain size={18} className="text-spider-red" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">
                                    Train Model
                                </h3>
                                <p className="text-xs text-white/35 mt-0.5">
                                    {analysisData.filename || "Uploaded dataset"} &middot; {analysisData.rows?.toLocaleString()} rows
                                </p>
                            </div>
                        </div>
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
                            style.bg, style.border, style.color
                        )}>
                            {style.label}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <div className="flex-1 min-w-0">
                                <p className="text-white/40 text-xs mb-1">Recommended Model</p>
                                <p className="text-white text-2xl font-bold tracking-tight">{mlRec.recommended_model}</p>
                                {mlRec.target_column && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Target size={12} className="text-rose-400" />
                                        <span className="text-white/50 text-xs">
                                            Target: <span className="text-rose-400 font-medium">{mlRec.target_column}</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleTrain}
                                disabled={isTraining}
                                className={cn(
                                    "flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300",
                                    isTraining
                                        ? "bg-white/[0.05] text-white/30 cursor-not-allowed border border-white/[0.06]"
                                        : "bg-spider-red text-white hover:bg-spider-red/80 hover:shadow-[0_0_30px_rgba(177,18,38,0.3)] active:scale-[0.98]"
                                )}
                            >
                                {isTraining ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Training...
                                    </>
                                ) : (
                                    <>
                                        <Play size={16} />
                                        Train Model
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Error State ─────────────────────────────────── */}
                <AnimatePresence>
                    {error && !isTraining && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 flex items-start gap-3"
                        >
                            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-400 text-sm font-medium">Training Failed</p>
                                <p className="text-red-400/60 text-xs mt-1">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Training Results ────────────────────────────── */}
                <AnimatePresence>
                    {trainingResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            {/* Success Banner */}
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 flex items-center gap-3">
                                <CheckCircle2 size={18} className="text-emerald-400" />
                                <div>
                                    <p className="text-emerald-400 text-sm font-medium">
                                        Model trained successfully
                                    </p>
                                    <p className="text-emerald-400/50 text-xs mt-0.5">
                                        {trainingResult.model_trained} &middot; {trainingResult.train_size.toLocaleString()} train / {trainingResult.test_size.toLocaleString()} test samples
                                    </p>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <section>
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="w-1.5 h-7 rounded-full bg-spider-red" />
                                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                                        <ChromaticText text="Performance Metrics" intensity={8} as="span" />
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(trainingResult.metrics).map(([key, value], i) => {
                                        const meta = METRIC_META[key] || { label: key, icon: <Activity size={14} />, format: (v: number) => String(v), good: () => true };
                                        const isGood = meta.good(value);

                                        return (
                                            <motion.div
                                                key={key}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="bg-black border border-white/[0.06] rounded-xl p-5 text-center hover:border-white/[0.12] transition-colors"
                                            >
                                                <div className={cn(
                                                    "inline-flex items-center justify-center w-8 h-8 rounded-lg mb-3",
                                                    isGood ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                                )}>
                                                    {meta.icon}
                                                </div>
                                                <p className="text-2xl font-bold text-white tabular-nums">
                                                    {meta.format(value)}
                                                </p>
                                                <p className="text-xs text-white/35 mt-1.5 uppercase tracking-wider">
                                                    {meta.label}
                                                </p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Feature Importances */}
                            {trainingResult.feature_importances && trainingResult.feature_importances.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-1.5 h-7 rounded-full bg-cyan" />
                                        <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                                            <ChromaticText text="Feature Importances" intensity={8} as="span" />
                                        </h2>
                                    </div>

                                    <div className="bg-black border border-white/[0.06] rounded-xl p-6 space-y-3">
                                        {(() => {
                                            const maxImp = Math.max(
                                                ...trainingResult.feature_importances!.map((f) => f.importance)
                                            );
                                            return trainingResult.feature_importances!.map((f, i) => (
                                                <ImportanceBar
                                                    key={f.feature}
                                                    feature={f.feature}
                                                    importance={f.importance}
                                                    maxImportance={maxImp}
                                                    index={i}
                                                />
                                            ));
                                        })()}
                                    </div>
                                </section>
                            )}

                            {/* Cluster Sizes */}
                            {trainingResult.cluster_sizes && (
                                <section>
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-1.5 h-7 rounded-full bg-purple-500" />
                                        <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                                            <ChromaticText text="Cluster Distribution" intensity={8} as="span" />
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {Object.entries(trainingResult.cluster_sizes).map(([label, size], i) => (
                                            <motion.div
                                                key={label}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="bg-black border border-purple-500/20 rounded-xl p-5 text-center"
                                            >
                                                <p className="text-2xl font-bold text-white tabular-nums">
                                                    {(size as number).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-purple-400/60 mt-1.5 uppercase tracking-wider">
                                                    Cluster {label}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Class Labels */}
                            {trainingResult.class_labels && trainingResult.class_labels.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-1.5 h-7 rounded-full bg-rose-500" />
                                        <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                                            <ChromaticText text="Class Labels" intensity={8} as="span" />
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {trainingResult.class_labels.map((label) => (
                                            <div
                                                key={label}
                                                className="flex items-center gap-1.5 px-4 py-2.5 bg-black border border-white/[0.06] rounded-lg text-sm text-white/60"
                                            >
                                                <ChevronRight size={12} className="text-white/30" />
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Training History ────────────────────────────── */}
                {history.length > 0 && (
                    <section>
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-1.5 h-7 rounded-full bg-spider-red" />
                            <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest">
                                <ChromaticText text="Training History" intensity={8} as="span" />
                            </h2>
                            <span className="text-[9px] text-dim/40 uppercase tracking-[0.3em]">
                                {history.length} runs
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.map((item, i) => (
                                <HistoryCard key={item.id} item={item} index={i} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
