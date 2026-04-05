import React, { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { InsightCard } from "@/components/InsightCard";
import { MLAdvisorCard } from "@/components/MLAdvisorCard";
import { useMultiverse } from "@/engine/MultiverseProvider";
import {
    Rows,
    Columns,
    Activity,
    AlertTriangle,
    Download,
    FileJson,
    BarChart3,
} from "lucide-react";
import { useAnalysisStore } from "@/store/analysisStore";
import { motion, AnimatePresence } from "framer-motion";
import { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatNumber, cn } from "@/lib/utils";
import { SettingsDialOverlay } from "@/components/settings/SettingsDialOverlay";
import { useSettingsStore } from "@/store/settingsStore";
import { Settings, Menu } from "lucide-react";

import { Save } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import {
    clearPersistedActiveSession,
    getAnalysisBySession,
    pingAnalysisSession,
} from "@/services/analysisService";
import { useAuth } from "@/hooks/useAuth";

export default function AnalysisDashboard() {
    const params = useParams();
    const sessionId = params?.sessionId as string | undefined;
    const router = useRouter();
    const { activeTab, setActiveTab, analysisData, setAnalysisData, _hasHydrated } = useAnalysisStore();
    const { toggleSettings, grid } = useSettingsStore();
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { state: mvState, visuals } = useMultiverse();
    const { saveProject } = useProjectStore();

    const fetchedSessionRef = useRef<string | null>(null);

    const handleSaveSnapshot = () => {
        if (!analysisData) return;
        saveProject(analysisData);
        toast.success("Analysis archived to Command Profile");
    };

    // Fetch data if not present (e.g. on refresh)
    // Wait for store hydration before deciding whether to fetch
    useEffect(() => {
        if (!sessionId || !_hasHydrated) return;

        // Already fetched this session
        if (fetchedSessionRef.current === sessionId) {
            setIsLoading(false);
            return;
        }

        // Data already in store for this session
        if (analysisData && analysisData.session_id === sessionId) {
            fetchedSessionRef.current = sessionId;
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        const fetchData = async (retryCount = 0) => {
            setIsLoading(true);
            try {
                const report = await getAnalysisBySession(sessionId);

                if (isMounted) {
                    setAnalysisData(report);
                    setIsLoading(false);
                    fetchedSessionRef.current = sessionId;
                    toast.success("Dimension restored successfully.");
                }
            } catch (error) {
                console.error("Failed to fetch analysis:", error);

                // If it's a 404, the backend data may not be fully synced yet. Single retry handler:
                if (error instanceof AxiosError && error.response?.status === 404 && retryCount < 1) {
                    console.log("Session not immediately found, retrying in 500ms...");
                    setTimeout(() => fetchData(retryCount + 1), 500);
                    return;
                }

                if (isMounted) {
                    // Absolute failure or session expired
                    toast.error("Session expired or unreachable. Returning to central node.");
                    clearPersistedActiveSession();
                    router.push("/dataset");
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        return () => {
            isMounted = false;
        };
    }, [sessionId, setAnalysisData, _hasHydrated, router]);

    // Background auth token / session alive ping (Execute every 5 minutes)
    useEffect(() => {
        if (!sessionId) return;
        const pingInterval = setInterval(async () => {
            try {
                await pingAnalysisSession(sessionId).catch(() => { });
            } catch (error) {
                console.debug("Silent ping failed", error);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(pingInterval);
    }, [sessionId]);

    const renderTabContent = () => {
        if (!analysisData) return null;

        switch (activeTab) {
            case "overview":
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Rows" value={analysisData.rows || 0} icon={Rows} delay={0} />
                            <StatCard label="Total Columns" value={analysisData.columns || 0} icon={Columns} delay={0.1} />
                            <StatCard label="Missing Values" value={Object.values(analysisData.missing_counts || {}).reduce((a: any, b: any) => a + (b as number), 0) as number} icon={AlertTriangle} delay={0.2} trend="warn" />
                            <StatCard label="Data Health" value={`${analysisData.health_score || 0}%`} icon={Activity} delay={0.3} trend="good" />
                        </div>

                        <div>
                            <h3 className="text-white font-medium text-base mb-4 flex items-center gap-2">
                                <FileJson size={16} className="text-white/40" /> Data Preview
                            </h3>
                            <DataTable data={analysisData.preview || []} columns={Object.keys(analysisData.dtypes || {})} />
                        </div>
                    </div>
                );
            case "stats":
                return (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-white font-medium text-base">Statistical Distribution</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(analysisData.stats_numerical || {}).map(([key, value]: [string, any], i) => (
                                <div key={key} className="p-5 bg-[#080808] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors">
                                    <h4 className="text-white/80 font-mono text-sm font-medium mb-4">{key}</h4>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-sm"><span className="text-white/40">Mean</span> <span className="text-white/80 font-mono tabular-nums">{formatNumber(value.mean)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-white/40">Std Dev</span> <span className="text-white/80 font-mono tabular-nums">{formatNumber(value.std)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-white/40">Min</span> <span className="text-white/80 font-mono tabular-nums">{formatNumber(value.min)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-white/40">Max</span> <span className="text-white/80 font-mono tabular-nums">{formatNumber(value.max)}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "viz":
                return (
                    <div className="w-full animate-in fade-in duration-700 space-y-6">
                        {analysisData.chart_configs && analysisData.chart_configs.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {analysisData.chart_configs.map((config: any, i: number) => (
                                    <div key={i} className="bg-[#080808] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-colors">
                                        <h4 className="text-white/80 text-sm font-medium mb-4">
                                            {config.title}
                                        </h4>
                                        <div className="h-[300px] w-full">
                                            <ChartRenderer config={config} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-white/30 border border-dashed border-white/[0.08] rounded-xl">
                                <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm">No visual patterns detected</p>
                            </div>
                        )}
                    </div>
                );
            case "insights":
                return (
                    <div className="space-y-4 animate-in slide-in-from-right-8 duration-500">
                        {(analysisData.insights || []).map((insight: any, i: number) => (
                            <InsightCard key={i} index={i} insight={insight} />
                        ))}
                        {(!analysisData.insights || analysisData.insights.length === 0) && (
                            <div className="text-white/30 text-sm text-center py-16 border border-dashed border-white/[0.08] rounded-xl">No insights generated</div>
                        )}
                    </div>
                );
            case "ml":
                return (
                    <div className="animate-in zoom-in-95 duration-500">
                        {analysisData.ml_recommendation && analysisData.ml_recommendation.dataset_summary ? (
                            <MLAdvisorCard recommendation={analysisData.ml_recommendation} />
                        ) : (
                            <div className="text-white/30 text-sm text-center py-16 border border-dashed border-white/[0.08] rounded-xl">No ML recommendations available</div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="analysis-loading">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-spider-red/30 border-t-spider-red rounded-full animate-spin" />
                    <p className="analysis-loading-copy animate-pulse">
                        Loading analysis...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="analysis-root">
            {/* Sticky Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={(id) => { setActiveTab(id); setSidebarOpen(false); }}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                className="analysis-sidebar-shell"
            />

            <main className="analysis-shell">
                {/* State-reactive grid background */}
                <div
                    className={cn(
                        "analysis-grid-bg",
                        grid === "hidden" ? "opacity-0" : "opacity-100"
                    )}
                    style={{
                        backgroundImage: `linear-gradient(rgba(177,18,38,${grid === 'strong' ? 0.3 : 0.1}) 1px, transparent 1px), linear-gradient(90deg, rgba(177,18,38,${grid === 'strong' ? 0.3 : 0.1}) 1px, transparent 1px)`,
                        backgroundSize: '30px 30px',
                        opacity: grid === "hidden" ? 0 : 0.03 + visuals.glitchIntensity * 0.08,
                    }}
                />

                {/* Dashboard Toolbar (Replaces previous Header) */}
                <div className="analysis-toolbar">
                    <div className="flex flex-col gap-1 min-w-0">
                        <div className="analysis-toolbar-group">
                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                            >
                                <Menu size={18} className="text-white/40" />
                            </button>
                            {/* Settings Trigger */}
                            <button
                                onClick={() => toggleSettings(true)}
                                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                            >
                                <Settings size={16} className="text-white/40 hover:text-white/70 transition-colors" />
                            </button>

                            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            <h1 className="analysis-toolbar-title truncate">
                                {analysisData?.problem_statement || analysisData?.filename || "Untitled Analysis"}
                            </h1>
                        </div>
                        <p className="analysis-toolbar-status">
                            Session {sessionId?.toString().slice(0, 8)}
                            {analysisData?.filename && ` · ${analysisData.filename}`}
                        </p>
                    </div>

                    <div className="analysis-action-row">
                        <button
                            onClick={handleSaveSnapshot}
                            className="analysis-action-button"
                        >
                            <Save size={14} /> Save
                        </button>

                        <button className="analysis-action-button analysis-action-button--accent">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="analysis-content-shell">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {renderTabContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </main>

            {/* Circular Settings Overlay */}
            < SettingsDialOverlay />
        </div >
    );
}
