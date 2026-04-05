import React from "react";
import {
    AlertCircle,
    AlertTriangle,
    Link as LinkIcon,
    TrendingUp,
    Target,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const iconMap = {
    AlertCircle,
    AlertTriangle,
    Link: LinkIcon,
    TrendingUp,
    Target,
    Info
};

interface InsightBadgeProps {
    type: "success" | "warning" | "danger" | "purple";
    icon: string;
    message: string;
    tag: string;
    column?: string;
    columns?: string[];
}

export const InsightBadge: React.FC<InsightBadgeProps> = ({
    type,
    icon,
    message,
    tag,
    column,
    columns,
}) => {
    const Icon = (iconMap as any)[icon] || Info;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={cn(
                "p-5 rounded-xl border flex gap-5 items-start transition-all duration-300",
                type === "success" && "bg-[#081A12] border-success/30 text-success",
                type === "warning" && "bg-[#1A1508] border-warning/30 text-warning",
                type === "danger" && "bg-[#1A0808] border-danger/30 text-danger",
                type === "purple" && "bg-[#0D0818] border-purple/30 text-lavender"
            )}
        >
            <div className={cn(
                "p-2.5 rounded-lg flex-shrink-0 mt-0.5",
                type === "success" && "bg-success/10",
                type === "warning" && "bg-warning/10",
                type === "danger" && "bg-danger/10",
                type === "purple" && "bg-purple/10"
            )}>
                <Icon size={20} />
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                        {tag}
                    </span>
                    {(column || (columns && columns.length > 0)) && (
                        <span className="text-[10px] bg-void/50 px-2 py-0.5 rounded border border-white/10 font-mono text-white/60">
                            {column || columns?.join(", ")}
                        </span>
                    )}
                </div>
                <p className="text-sm font-ui font-medium leading-relaxed text-white">
                    {message}
                </p>
            </div>
        </motion.div>
    );
};
