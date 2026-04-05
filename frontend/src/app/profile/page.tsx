import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/projectStore";
import { ProjectCard } from "@/components/profile/ProjectCard";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AnalysisHistoryCard } from "@/components/profile/AnalysisHistoryCard";
import {
    Archive,
    Download,
    UserCog,
    PlusCircle,
    BarChart3,
    Lightbulb,
    FileText,
    Sparkles,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import {
    getUserAnalysisHistory,
    type AnalysisHistoryItem,
} from "@/services/analysisService";

const TABS = [
    { id: "datasets", label: "Datasets" },
    { id: "analyses", label: "Analyses" },
    { id: "insights", label: "Insights" },
    { id: "reports", label: "Reports" },
    { id: "settings", label: "Settings" },
];

const SUGGESTED_TEMPLATES = [
    {
        title: "Customer Churn Prediction",
        description: "Predict customer retention patterns using ML classification.",
        tag: "Classification",
    },
    {
        title: "Sales Trend Analysis",
        description: "Analyze revenue trends and seasonal patterns over time.",
        tag: "Time Series",
    },
    {
        title: "Market Segmentation",
        description: "Cluster your audience into meaningful segments with AI.",
        tag: "Clustering",
    },
];

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("datasets");
    const { projects } = useProjectStore();
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function fetchHistory() {
            setHistoryLoading(true);
            setHistoryError(false);
            try {
                const history = await getUserAnalysisHistory();
                if (!cancelled) setAnalysisHistory(history);
            } catch {
                if (!cancelled) setHistoryError(true);
            } finally {
                if (!cancelled) setHistoryLoading(false);
            }
        }
        fetchHistory();
        return () => { cancelled = true; };
    }, []);

    return (
        <main className="profile-root">
            {/* Cinematic Background Elements */}
            <div className="profile-background">
                <div className="profile-background-glow" />
            </div>

            {/* ── Profile Header (Cover + Avatar + Stats) ─────────── */}
            <div className="profile-shell pt-20">
                <ProfileHeader />
            </div>

            {/* ── Tab Navigation (Sticky) ─────────────────────────── */}
            <div className="profile-tabs-shell">
                <ProfileTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {/* ── Content Area ────────────────────────────────────── */}
            <div className="profile-shell profile-content-shell">
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {/* ── Datasets Tab ───────────────────────── */}
                        {activeTab === "datasets" && (
                            <motion.div
                                key="datasets"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-heading font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                        <Archive size={18} className="text-spider-red" />
                                        Your Datasets ({projects.length})
                                    </h2>
                                    <Link href="/">
                                        <button className="flex items-center gap-2 px-5 py-2.5 bg-spider-red text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-spider-red/80 transition-all cursor-pointer">
                                            <PlusCircle size={13} /> New Analysis
                                        </button>
                                    </Link>
                                </div>

                                {projects.length === 0 ? (
                                    <div className="profile-empty-state">
                                        <Archive size={40} className="text-dim mb-4 opacity-30" />
                                        <p className="profile-empty-copy text-sm mb-1">No datasets yet</p>
                                        <p className="text-dim/50 text-[11px]">
                                            Upload your first dataset to get started
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-5">
                                        {projects.map((project, i) => (
                                            <ProjectCard key={project.id} project={project} index={i} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Analyses Tab ────────────────────────── */}
                        {activeTab === "analyses" && (
                            <motion.div
                                key="analyses"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-heading font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                        <BarChart3 size={18} className="text-spider-red" />
                                        Analysis History ({analysisHistory.length})
                                    </h2>
                                    <Link href="/">
                                        <button className="flex items-center gap-2 px-5 py-2.5 bg-spider-red text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-spider-red/80 transition-all cursor-pointer">
                                            <PlusCircle size={13} /> New Analysis
                                        </button>
                                    </Link>
                                </div>

                                {historyLoading ? (
                                    <div className="profile-empty-state">
                                        <Loader2 size={32} className="text-spider-red animate-spin mb-4" />
                                        <p className="text-dim text-sm">Loading analysis history...</p>
                                    </div>
                                ) : historyError ? (
                                    <div className="profile-empty-state">
                                        <BarChart3 size={40} className="text-dim mb-4 opacity-30" />
                                        <p className="profile-empty-copy text-sm mb-1">Could not load history</p>
                                        <p className="text-dim/50 text-[11px]">
                                            Sign in to view your analysis history
                                        </p>
                                    </div>
                                ) : analysisHistory.length === 0 ? (
                                    <div className="profile-empty-state">
                                        <BarChart3 size={40} className="text-dim mb-4 opacity-30" />
                                        <p className="profile-empty-copy text-sm mb-1">No analyses yet</p>
                                        <p className="text-dim/50 text-[11px]">
                                            Upload a dataset to run your first analysis
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {analysisHistory.map((item, i) => (
                                            <AnalysisHistoryCard key={item.id} item={item} index={i} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── Insights Tab ────────────────────────── */}
                        {activeTab === "insights" && (
                            <motion.div
                                key="insights"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="profile-panel flex flex-col items-center justify-center h-80 text-center space-y-5"
                            >
                                <Lightbulb size={48} className="text-spider-red opacity-40" />
                                <div>
                                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest mb-2">
                                        Generated Insights
                                    </h2>
                                    <p className="text-dim text-sm max-w-md leading-relaxed">
                                        AI-generated insights from your data analyses will be collected
                                        here for quick reference and export.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Reports Tab ─────────────────────────── */}
                        {activeTab === "reports" && (
                            <motion.div
                                key="reports"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="profile-panel flex flex-col items-center justify-center h-80 text-center space-y-5"
                            >
                                <FileText size={48} className="text-spider-red opacity-40" />
                                <div>
                                    <h2 className="text-xl font-heading font-bold text-white uppercase tracking-widest mb-2">
                                        Exported Reports
                                    </h2>
                                    <p className="text-dim text-sm max-w-md leading-relaxed">
                                        Export analysis results as structured reports. All exported
                                        reports will be archived here.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── Settings Tab ────────────────────────── */}
                        {activeTab === "settings" && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="max-w-2xl mx-auto space-y-8"
                            >
                                <div className="profile-panel p-8 bg-black">
                                    <h3 className="text-white font-heading font-bold text-base uppercase tracking-widest flex items-center gap-3 mb-8">
                                        <UserCog size={18} className="text-spider-red" />
                                        System Preferences
                                    </h3>

                                    <div className="space-y-0">
                                        {[
                                            {
                                                title: "Auto-Save Snapshots",
                                                desc: "Automatically archive analysis on completion",
                                                active: true,
                                            },
                                            {
                                                title: "High Contrast Mode",
                                                desc: "Reduce interface transparency",
                                                active: false,
                                            },
                                            {
                                                title: "Data Retention",
                                                desc: "Local Browser Storage Only",
                                                isLabel: true,
                                                labelText: "Persistent",
                                            },
                                        ].map((setting, i) => (
                                            <div
                                                key={setting.title}
                                                    className={`flex justify-between items-center py-5 ${i < 2 ? "border-b border-white/[0.04]" : ""
                                                        }`}
                                            >
                                                <div>
                                                    <p className="text-white font-bold text-sm uppercase tracking-wider">
                                                        {setting.title}
                                                    </p>
                                                    <p className="text-dim text-[11px] mt-1">
                                                        {setting.desc}
                                                    </p>
                                                </div>
                                                {setting.isLabel ? (
                                                    <span className="text-spider-red text-[10px] font-bold uppercase">
                                                        {setting.labelText}
                                                    </span>
                                                ) : (
                                                    <div
                                                        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${setting.active
                                                                ? "bg-spider-red"
                                                                : "bg-white/10"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${setting.active
                                                                    ? "right-1"
                                                                    : "left-1"
                                                                }`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Suggested AI Templates ──────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="profile-suggested-shell"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles size={16} className="text-spider-red opacity-60" />
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-dim">
                            Suggested AI Templates
                        </h3>
                    </div>

                    <div className="profile-suggested-grid">
                        {SUGGESTED_TEMPLATES.map((template) => (
                            <div
                                key={template.title}
                                className="profile-suggested-card group"
                            >
                                <span className="profile-suggested-badge px-2 py-0.5 mb-3">
                                    {template.tag}
                                </span>
                                <h4 className="text-white text-sm font-bold mb-2 group-hover:text-spider-red transition-colors">
                                    {template.title}
                                </h4>
                                <p className="text-dim text-[12px] leading-relaxed">
                                    {template.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
