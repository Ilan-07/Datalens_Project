import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AnalysisState {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    analysisData: any | null;
    setAnalysisData: (data: any) => void;
    reset: () => void;

    /* Hydration guard — prevents rendering before sessionStorage rehydrates */
    _hasHydrated: boolean;
    setHasHydrated: (v: boolean) => void;
}

export const useAnalysisStore = create<AnalysisState>()(
    persist(
        (set) => ({
            activeTab: "overview",
            setActiveTab: (tab) => set({ activeTab: tab }),
            analysisData: null,
            setAnalysisData: (data) => set({ analysisData: data }),
            reset: () => set({ activeTab: "overview", analysisData: null }),

            _hasHydrated: false,
            setHasHydrated: (v) => set({ _hasHydrated: v }),
        }),
        {
            name: "datalens-analysis-storage",
            storage: createJSONStorage(() => localStorage),
            // Only persist data, not ephemeral UI state like _hasHydrated
            partialize: (state) => ({
                activeTab: state.activeTab,
                analysisData: state.analysisData,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
