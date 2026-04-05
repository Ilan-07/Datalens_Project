import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface UploadZoneProps {
    onUpload: (file: File) => void;
    isUploading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isUploading }) => {
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                toast.error("Invalid segment. Only .CSV dimension fragments allowed.");
                return;
            }
            setFile(selectedFile);
            onUpload(selectedFile);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "text/csv": [".csv"] },
        multiple: false,
        disabled: isUploading,
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="w-full"
        >
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer transition-all duration-500",
                    "w-full h-80 border border-spider-shadow flex flex-col items-center justify-center p-12",
                    "bg-black hover:bg-spider-red/[0.02] hover:border-spider-red",
                    isDragActive && "border-spider-red bg-spider-red/5 shadow-[0_0_50px_rgba(177,18,38,0.1)]",
                    isUploading && "opacity-50 cursor-wait"
                )}
            >
                <input {...getInputProps()} />

                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-spider-red/40 group-hover:border-spider-red transition-colors" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-spider-red/40 group-hover:border-spider-red transition-colors" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-spider-red/40 group-hover:border-spider-red transition-colors" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-spider-red/40 group-hover:border-spider-red transition-colors" />

                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center text-center space-y-6"
                        >
                            <div className="p-6 bg-spider-red/10 border border-spider-red/20 group-hover:border-spider-red transition-all duration-500">
                                <Upload size={40} className="text-spider-red" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-heading font-black text-xl uppercase italic tracking-widest">
                                    Inject Data
                                </p>
                                <p className="text-dim text-[10px] uppercase tracking-[0.3em]">
                                    Drop .CSV Dimension Segment
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="file"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center space-y-6"
                        >
                            <div className="p-6 bg-spider-red/10 border border-spider-red">
                                <FileText size={40} className="text-spider-red" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-heading font-black text-xl uppercase italic tracking-widest truncate max-w-[280px]">
                                    {file.name}
                                </p>
                                <p className="text-spider-red font-bold text-[10px] uppercase tracking-[0.3em]">
                                    Segment Detected ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isUploading && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-spider-shadow overflow-hidden">
                        <motion.div
                            initial={{ left: '-100%' }}
                            animate={{ left: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute top-0 bottom-0 w-1/2 bg-spider-red shadow-[0_0_15px_#B11226]"
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};
