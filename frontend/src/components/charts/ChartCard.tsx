import React from "react";
import { Download, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChartCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    description,
    children,
    className,
    delay = 0,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "chart-card group",
                className
            )}
        >
            <div className="chart-card-header">
                <div className="chart-card-title-wrap">
                    <h3 className="chart-card-title">
                        {title}
                    </h3>
                    {description && (
                        <p className="chart-card-description">{description}</p>
                    )}
                </div>

                <div className="chart-card-actions">
                    <button className="chart-card-icon-btn" title="Download PNG">
                        <Download size={14} />
                    </button>
                    <button className="chart-card-icon-btn" title="Expand">
                        <Maximize2 size={14} />
                    </button>
                </div>

            </div>

            <div className="chart-card-body">
                {children}
            </div>
        </motion.div>
    );
};
