import { motion } from "framer-motion";
import { Activity, FileSpreadsheet, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { AnalysisHistoryItem } from "@/services/analysisService";

interface AnalysisHistoryCardProps {
    item: AnalysisHistoryItem;
    index: number;
}

export const AnalysisHistoryCard: React.FC<AnalysisHistoryCardProps> = ({ item, index }) => {
    const createdDate = item.created_at
        ? format(new Date(item.created_at), "yyyy.MM.dd · HH:mm")
        : "Unknown date";

    const isCompleted = item.status === "completed";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="project-card-wrap group"
        >
            <div className="project-card-shell">
                <div className="project-card-layout">
                    {/* Left: Metadata */}
                    <div className="project-card-main">
                        <div>
                            <div className="project-card-meta">
                                <span className="project-card-meta-text">
                                    {createdDate} // SES_{item.id.slice(0, 6)}
                                </span>
                                <div className="project-card-divider" />
                            </div>

                            <h3 className="project-card-title">
                                {item.filename || "Untitled Analysis"}
                            </h3>

                            <div className="flex items-center gap-4 mt-2">
                                {item.rows != null && (
                                    <span className="text-dim text-[11px] font-mono">
                                        {item.rows.toLocaleString()} rows
                                    </span>
                                )}
                                {item.columns != null && (
                                    <span className="text-dim text-[11px] font-mono">
                                        {item.columns} cols
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="project-card-tags">
                            <span className={`project-card-tag ${isCompleted ? "" : "opacity-50"}`}>
                                {isCompleted ? "Completed" : item.status}
                            </span>
                            {item.rows != null && item.rows > 1000 && (
                                <span className="project-card-tag">Large Dataset</span>
                            )}
                        </div>
                    </div>

                    {/* Right: Health Score + View */}
                    <div className="project-card-side">
                        <div className="project-card-side-head">
                            <Activity className="text-spider-red opacity-50" size={20} />
                            <div className="project-card-score-wrap">
                                <div className="project-card-score">
                                    {item.health_score != null ? `${item.health_score}%` : "—"}
                                </div>
                                <div className="project-card-score-label">Health</div>
                            </div>
                        </div>

                        <div className="project-card-actions">
                            <Link href={`/analysis/${item.id}`}>
                                <button
                                    className="project-card-btn project-card-btn-export flex items-center gap-1.5"
                                    title="View Analysis"
                                >
                                    <FileSpreadsheet size={14} />
                                    <ArrowRight size={14} />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="project-card-shimmer" />

                {/* Active Edge */}
                <div className="project-card-edge" />
            </div>
        </motion.div>
    );
};
