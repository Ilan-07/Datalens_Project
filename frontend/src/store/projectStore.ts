import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ProjectSnapshot {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    datasetName: string;
    analysisData: any; // Full snapshot of the analysis
    tags: string[];
    confidenceScore: number;
    graphType: string;
}

interface ProjectState {
    projects: ProjectSnapshot[];
    saveProject: (analysisData: any) => void;
    deleteProject: (id: string) => void;
    deleteAllProjects: () => void;
    getProject: (id: string) => ProjectSnapshot | undefined;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projects: [],

            saveProject: (analysisData: any) => {
                // Prevent duplicate saves for the same session
                const existingSession = get().projects.find(
                    (p) => p.analysisData?.session_id && p.analysisData.session_id === analysisData.session_id
                );
                if (existingSession) return;

                const newProject: ProjectSnapshot = {
                    id: crypto.randomUUID(),
                    title: analysisData.filename || `Untitled Analysis ${new Date().toLocaleDateString()}`,
                    description: analysisData.problem_statement || "No problem statement provided.",
                    createdAt: new Date().toISOString(),
                    datasetName: analysisData.filename,
                    analysisData: analysisData,
                    tags: ["Analysis", analysisData.ml_recommendation ? "ML Ready" : "Raw Data"],
                    confidenceScore: analysisData.health_score || 85,
                    graphType: "Bar Chart", // Could be dynamic based on first chart config
                };

                set((state) => ({
                    projects: [newProject, ...state.projects],
                }));
            },

            deleteProject: (id: string) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                }));
            },

            deleteAllProjects: () => {
                set({ projects: [] });
            },

            getProject: (id: string) => {
                return get().projects.find((p) => p.id === id);
            }
        }),
        {
            name: "datalens-projects-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
