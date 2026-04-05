import React from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    BarChart3,
    PieChart,
    Search,
    Cpu,
    Settings,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/store/settingsStore";
import { GlitchWrapper } from "@/components/GlitchWrapper";

const navItems = [
    { label: "Overview", icon: LayoutDashboard, id: "overview" },
    { label: "Statistics", icon: BarChart3, id: "stats" },
    { label: "Visualizations", icon: PieChart, id: "viz" },
    { label: "Smart Insights", icon: Search, id: "insights" },
    { label: "ML Advisor", icon: Cpu, id: "ml" },
];

const secondaryItems = [
    { label: "Settings", icon: Settings, id: "settings" },
    { label: "Help Center", icon: HelpCircle, id: "help" },
];

interface SidebarProps {
    activeTab: string;
    setActiveTab: (id: string) => void;
    isCollapsed?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
}

import { useAnalysisStore } from "@/store/analysisStore";

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, isOpen, onClose, className }) => {
    const { toggleSettings } = useSettingsStore();
    const { analysisData } = useAnalysisStore();

    return (
        <>
        {isOpen && onClose && <div className="sidebar-backdrop" onClick={onClose} />}
        <aside className={cn(
            "sidebar-shell",
            isCollapsed ? "sidebar-shell-collapsed" : "sidebar-shell-expanded",
            isOpen && "sidebar-open",
            className
        )}>
            {/* Logo */}
            <div className="sidebar-logo-row">
                <Link href="/" className="sidebar-logo-link group">
                    <GlitchWrapper>
                        <div className="sidebar-logo-box">
                            <BarChart3 size={18} className="text-white" />
                        </div>
                    </GlitchWrapper>
                    {!isCollapsed && (
                        <span className="sidebar-logo-text">
                            {analysisData?.problem_statement || analysisData?.filename || "DataLens"}
                        </span>
                    )}
                </Link>
            </div>

            {/* Main Nav */}
            <nav className="sidebar-main-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "sidebar-item group",
                            activeTab === item.id
                                ? "sidebar-item-active"
                                : "sidebar-item-inactive"
                        )}
                    >
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="active-pill"
                                className="sidebar-item-active-pill"
                            />
                        )}
                        <item.icon size={18} className={cn(
                            activeTab === item.id ? "text-spider-red" : "group-hover:text-spider-red transition-colors"
                        )} />
                        {!isCollapsed && (
                            <span className="sidebar-item-label">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Secondary Nav */}
            <div className="sidebar-secondary">
                {secondaryItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            if (item.id === "settings") {
                                toggleSettings(true);
                            } else {
                                setActiveTab(item.id);
                            }
                        }}
                        className={cn(
                            "sidebar-item sidebar-item-inactive"
                        )}
                    >
                        <item.icon size={18} />
                        {!isCollapsed && (
                            <span className="sidebar-item-label">
                                {item.label}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </aside>
        </>
    );
};
