import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, Copy, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { generateNarrative } from "@/services/analysisService";

interface AIReportProps {
    sessionId: string;
    initialNarrative?: string;
}

import { GlitchWrapper } from "@/components/GlitchWrapper";

export const AIReport: React.FC<AIReportProps> = ({ sessionId, initialNarrative }) => {
    const [narrative, setNarrative] = useState(initialNarrative || "");
    const [isGenerating, setIsGenerating] = useState(false);

    const generateReport = async () => {
        setIsGenerating(true);
        try {
            const response = await generateNarrative(sessionId);
            setNarrative(response.narrative);
            toast.success("Reality synched. Narrative decoded.");
        } catch (error) {
            console.error("Failed to generate narrative", error);
            toast.error("Transmission loss. Check your dimension uplink.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyNarrative = async () => {
        if (!narrative) return;
        await navigator.clipboard.writeText(narrative);
        toast.success("Narrative copied.");
    };

    const downloadNarrative = () => {
        if (!narrative) return;
        const blob = new Blob([narrative], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `datalens-narrative-${sessionId}.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-black border border-spider-shadow overflow-hidden relative">
            {/* Header */}
            <div className="px-8 py-8 border-b border-spider-shadow flex justify-between items-center bg-black relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-spider-red/10 border border-spider-red/20 text-spider-red">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <GlitchWrapper>
                            <h3 className="text-xl font-heading font-black text-white italic tracking-[0.1em] uppercase">Dimensional Narrative</h3>
                        </GlitchWrapper>
                        <p className="text-[10px] text-spider-red uppercase tracking-[0.4em] font-black mt-1">NARRATOR_ENGINE v3.5</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!narrative ? (
                        <button
                            onClick={generateReport}
                            disabled={isGenerating}
                            className="flex items-center gap-3 px-6 py-3 bg-spider-red text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-spider-red/80 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Synchronize Narrative
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={copyNarrative}
                                className="p-3 bg-spider-shadow/50 border border-spider-shadow text-dim hover:text-white transition-colors"
                            >
                                <Copy size={18} />
                            </button>
                            <button
                                onClick={downloadNarrative}
                                className="p-3 bg-spider-shadow/50 border border-spider-shadow text-dim hover:text-white transition-colors"
                            >
                                <Download size={18} />
                            </button>
                            <button
                                onClick={generateReport}
                                disabled={isGenerating}
                                className="p-3 bg-spider-shadow/50 border border-spider-shadow text-dim hover:text-white transition-colors"
                            >
                                <RefreshCcw size={18} className={cn(isGenerating && "animate-spin")} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-10 py-12 min-h-[400px] flex flex-col items-start relative bg-[#050505]">
                <AnimatePresence mode="wait">
                    {isGenerating ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full flex flex-col items-center gap-10 py-10"
                        >
                            <div className="relative w-20 h-20">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-2 border-dashed border-spider-red/20 rounded-full"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-2 border-2 border-spider-red rounded-full shadow-[0_0_15px_#B11226]"
                                />
                            </div>
                            <div className="text-center space-y-4">
                                <p className="text-spider-red font-heading font-black text-xs tracking-[0.5em] animate-pulse uppercase">
                                    Decoding Multiverse Patterns...
                                </p>
                                <div className="flex justify-center gap-1">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [4, 12, 4], opacity: [0.2, 1, 0.2] }}
                                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                            className="w-[2px] bg-spider-red"
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : narrative ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full"
                        >
                            <div className="prose prose-invert max-w-none font-sans text-muted text-lg leading-relaxed selection:bg-spider-red/30">
                                <div className="whitespace-pre-wrap first-letter:text-5xl first-letter:font-heading first-letter:font-black first-letter:text-spider-red first-letter:mr-3 first-letter:float-left first-line:uppercase first-line:tracking-widest first-line:font-bold first-line:text-white">
                                    {narrative}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col items-center justify-center space-y-8 py-20"
                        >
                            <div className="relative">
                                <Sparkles size={80} className="text-spider-red/10" />
                                <div className="absolute inset-0 bg-spider-red/5 blur-3xl rounded-full" />
                            </div>
                            <p className="text-dim text-[10px] uppercase tracking-[1em] font-bold text-center">
                                Narrative Buffer Empty // Await Signal
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scanning Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(177,18,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(177,18,38,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>
    );
};
