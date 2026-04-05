import React from "react";
import { motion } from "framer-motion";
import {
    AlertCircle,
    AlertTriangle,
    TrendingUp,
    Link,
    Target,
    Zap,
    Database,
    Hash,
    Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
    type: "danger" | "warning" | "info" | "purple";
    message: string;
    tag: string;
    icon?: string;
    column?: string;
    columns?: string[];
    severity?: number;
}

interface InsightCardProps {
    insight: Insight;
    index: number;
}

const iconMap: Record<string, React.ReactNode> = {
    AlertCircle: <AlertCircle size={16} />,
    AlertTriangle: <AlertTriangle size={16} />,
    TrendingUp: <TrendingUp size={16} />,
    Link: <Link size={16} />,
    Target: <Target size={16} />,
    Zap: <Zap size={16} />,
    Database: <Database size={16} />,
    Hash: <Hash size={16} />,
    Info: <Info size={16} />,
};

const typeStyles: Record<string, { border: string; bg: string; text: string; dot: string }> = {
    danger: {
        border: "border-red-500/20",
        bg: "bg-red-500/10",
        text: "text-red-400",
        dot: "bg-red-500",
    },
    warning: {
        border: "border-amber-500/20",
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-500",
    },
    info: {
        border: "border-sky-500/20",
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        dot: "bg-sky-500",
    },
    purple: {
        border: "border-purple-500/20",
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        dot: "bg-purple-500",
    },
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight, index }) => {
    const style = typeStyles[insight.type] || typeStyles.info;
    const icon = iconMap[insight.icon || "Info"] || <Info size={16} />;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            className="bg-[#080808] border border-white/[0.06] rounded-xl p-5 transition-all hover:border-white/[0.12] group"
        >
            <div className="flex items-start gap-3.5">
                {/* Icon */}
                <div className={cn("p-2 rounded-lg flex-shrink-0", style.bg)}>
                    <span className={style.text}>{icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Tag */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)} />
                        <span className={cn("text-xs font-medium", style.text)}>
                            {insight.tag}
                        </span>
                    </div>

                    {/* Message */}
                    <p className="text-white/60 text-sm leading-relaxed">
                        {insight.message}
                    </p>

                    {/* Affected columns */}
                    {(insight.column || insight.columns) && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {(insight.columns || [insight.column]).filter(Boolean).map((col) => (
                                <span
                                    key={col}
                                    className="text-xs font-mono text-white/40 bg-white/[0.04] px-2 py-0.5 rounded-md"
                                >
                                    {col}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
