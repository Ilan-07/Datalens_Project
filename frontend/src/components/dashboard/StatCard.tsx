import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { OdometerNumber } from "@/components/ui/OdometerNumber";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: "good" | "warn" | "bad";
    description?: string;
    delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon: Icon,
    trend,
    description,
    delay = 0,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="stat-card-root group"
        >
            <div className="stat-card-top">
                <div className="stat-card-icon group-hover:border-spider-red transition-all">
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className={cn(
                        "stat-card-trend",
                        trend === "good" && "stat-card-trend--good",
                        trend === "warn" && "stat-card-trend--warn",
                        trend === "bad" && "stat-card-trend--bad"
                    )}>
                        {trend}
                    </span>
                )}
            </div>

            <div className="stat-card-body">
                <p className="stat-card-label">
                    {label}
                </p>
                <h3 className="stat-card-value">
                    {typeof value === "number" || !isNaN(Number(value)) ? (
                        <OdometerNumber value={Number(value)} />
                    ) : typeof value === "string" && value.endsWith("%") && !isNaN(Number(value.slice(0, -1))) ? (
                        <OdometerNumber value={Number(value.slice(0, -1))} suffix="%" />
                    ) : (
                        value
                    )}
                </h3>
                {description && (
                    <p className="stat-card-description">
                        {description}
                    </p>
                )}
            </div>

            <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-white/[0.02] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};
