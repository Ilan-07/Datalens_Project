import React from "react";
import { motion } from "framer-motion";
import { Cpu, Lightbulb, ChevronRight, Zap, Target, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface MLRecommendation {
    problem_type: string;
    recommended_model: string;
    reason: string;
    target_column: string | null;
    alternatives: string[];
    dataset_summary: {
        rows: number;
        columns: number;
        numeric_features: number;
        categorical_features: number;
        size_category: string;
    };
}

interface MLAdvisorCardProps {
    recommendation: MLRecommendation;
}

const problemTypeStyles: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ReactNode }> = {
    regression: {
        color: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
        label: "Regression",
        icon: <Zap size={14} className="text-sky-400" />,
    },
    classification: {
        color: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        label: "Classification",
        icon: <Target size={14} className="text-rose-400" />,
    },
    clustering: {
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        label: "Clustering",
        icon: <Database size={14} className="text-purple-400" />,
    },
};

export const MLAdvisorCard: React.FC<MLAdvisorCardProps> = ({ recommendation }) => {
    const style = problemTypeStyles[recommendation.problem_type] || problemTypeStyles.regression;
    const { dataset_summary: ds } = recommendation;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-white tracking-tight">
                    ML Advisor
                </h2>
                <p className="text-sm text-white/40">
                    Intelligent model recommendation based on your dataset
                </p>
            </div>

            {/* Main Recommendation Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#080808] border border-white/[0.06] rounded-xl overflow-hidden"
            >
                {/* Top Badge */}
                <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/[0.05] rounded-lg">
                            <Cpu size={18} className="text-white/60" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white">
                                Model Recommendation
                            </h3>
                            <p className="text-xs text-white/35 mt-0.5">
                                Auto-detected from dataset analysis
                            </p>
                        </div>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                        style.bg, style.border, style.color, "border"
                    )}>
                        {style.icon}
                        {style.label}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Recommended Model */}
                    <div className="text-center py-4">
                        <p className="text-xs text-white/40 mb-2">
                            Recommended Model
                        </p>
                        <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            {recommendation.recommended_model}
                        </h3>
                    </div>

                    {/* Reasoning */}
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
                        <div className="flex items-start gap-3">
                            <Lightbulb size={18} className="text-amber-400/60 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-white/40 font-medium mb-1.5">
                                    Reasoning
                                </p>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    {recommendation.reason}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dataset Summary Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Rows", value: ds.rows.toLocaleString() },
                            { label: "Features", value: ds.columns },
                            { label: "Numeric", value: ds.numeric_features },
                            { label: "Categorical", value: ds.categorical_features },
                        ].map((item) => (
                            <div key={item.label} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-center">
                                <p className="text-xs text-white/35 mb-1">
                                    {item.label}
                                </p>
                                <p className="text-xl font-semibold text-white tabular-nums">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Target Column */}
                    {recommendation.target_column && (
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                            <Target size={14} className="text-rose-400" />
                            <p className="text-sm text-white/80">
                                Target: <span className="text-rose-400 font-medium">{recommendation.target_column}</span>
                            </p>
                        </div>
                    )}

                    {/* Alternatives */}
                    <div>
                        <p className="text-xs text-white/40 font-medium mb-3">
                            Alternative Models
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {recommendation.alternatives.map((alt) => (
                                <div
                                    key={alt}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white/60 hover:border-white/[0.12] hover:text-white/80 transition-colors cursor-default"
                                >
                                    <ChevronRight size={12} className="text-white/30" />
                                    {alt}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
