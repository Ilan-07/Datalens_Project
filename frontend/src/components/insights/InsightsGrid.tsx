import React from 'react';
import { InsightCard } from '@/components/InsightCard';

const dummyInsights = [
    { type: 'danger' as const, message: 'High anomaly score detected in transaction volume.', tag: 'ANOMALY', icon: 'AlertTriangle', severity: 0.9 },
    { type: 'warning' as const, message: 'Correlation drop between "Age" and "Income" features.', tag: 'DRIFT', icon: 'TrendingUp', severity: 0.6 },
    { type: 'info' as const, message: 'New data version available for ingestion.', tag: 'SYSTEM', icon: 'Database', severity: 0.2 },
    { type: 'purple' as const, message: 'Multiverse simulation converged on optimal path.', tag: 'AI_INSIGHT', icon: 'Zap', severity: 0.8 },
    { type: 'danger' as const, message: 'Missing values exceed threshold in column "Address".', tag: 'QUALITY', icon: 'AlertCircle', column: 'Address', severity: 0.85 },
    { type: 'warning' as const, message: 'Model confidence variance increased by 15%.', tag: 'MODEL', icon: 'Target', severity: 0.5 },
];

export const InsightsGrid = () => {
    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="mb-12">
                <h3 className="text-white font-heading font-black text-3xl italic uppercase tracking-widest mb-2">
                    System<span className="text-spider-red">Insights</span>
                </h3>
                <p className="text-[10px] text-dim uppercase tracking-[0.4em] font-mono">
                    Real-time Analysis Feed
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dummyInsights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} index={index} />
                ))}
            </div>
        </div>
    );
};
