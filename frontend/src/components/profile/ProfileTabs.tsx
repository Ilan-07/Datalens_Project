import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
}

interface ProfileTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ tabs, activeTab, onChange }) => {
    return (
        <div className="profile-tabs-root">
            <div className="profile-tabs-shell-inner">
                <div className="profile-tabs-list scrollbar-hide">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onChange(tab.id)}
                                className={cn(
                                    "profile-tab-button",
                                    isActive ? "profile-tab-button--active" : ""
                                )}
                            >
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="profileActiveTab"
                                        className="profile-tab-indicator"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
