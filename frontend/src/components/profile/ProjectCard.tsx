import { motion } from "framer-motion";
import { Trash2, Download, Activity } from "lucide-react";
import { ProjectSnapshot, useProjectStore } from "@/store/projectStore";
import { format } from "date-fns";
import { toast } from "sonner";

interface ProjectCardProps {
    project: ProjectSnapshot;
    index: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index }) => {
    const { deleteProject } = useProjectStore();

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project.analysisData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${project.title.replace(/\s+/g, '_')}_analysis.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Project exported successfully");
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteProject(project.id);
        toast.info("Project deleted from archive");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="project-card-wrap group"
        >
            {/* Glass Container */}
            <div className="project-card-shell">

                {/* Content Layout */}
                <div className="project-card-layout">

                    {/* Left: Metadata */}
                    <div className="project-card-main">
                        <div>
                            <div className="project-card-meta">
                                <span className="project-card-meta-text">
                                    {format(new Date(project.createdAt), "yyyy.MM.dd")} // ID_{project.id.slice(0, 4)}
                                </span>
                                <div className="project-card-divider" />
                            </div>

                            <h3 className="project-card-title">
                                {project.title}
                            </h3>

                            <p className="project-card-description line-clamp-2">
                                {project.description}
                            </p>
                        </div>

                        <div className="project-card-tags">
                            {project.tags.map(tag => (
                                <span key={tag} className="project-card-tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right: Actions & Stats */}
                    <div className="project-card-side">
                        <div className="project-card-side-head">
                            <Activity className="text-spider-red opacity-50" size={20} />
                            <div className="project-card-score-wrap">
                                <div className="project-card-score">
                                    {project.confidenceScore}%
                                </div>
                                <div className="project-card-score-label">Confidence</div>
                            </div>
                        </div>

                        <div className="project-card-actions">
                            <button
                                onClick={handleExport}
                                className="project-card-btn project-card-btn-export"
                                title="Export JSON"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="project-card-btn project-card-btn-delete"
                                title="Delete Project"
                            >
                                <Trash2 size={16} />
                            </button>
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
