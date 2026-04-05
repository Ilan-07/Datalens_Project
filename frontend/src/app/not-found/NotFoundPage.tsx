import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { GlitchText } from "@/engine/text/GlitchText";

export default function NotFoundPage() {
    return (
        <main className="min-h-screen bg-void flex items-center justify-center pt-[var(--nav-height)] px-4 sm:px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="border border-spider-shadow bg-black/30 p-8 sm:p-16 text-center max-w-lg w-full"
            >
                <AlertTriangle size={48} className="mx-auto text-spider-red/40 mb-8" />
                <h1 className="text-white font-heading font-black text-5xl uppercase tracking-wider mb-4">
                    <GlitchText>404</GlitchText>
                </h1>
                <p className="text-dim text-sm uppercase tracking-widest mb-8 opacity-50">
                    This dimension does not exist
                </p>
                <Link
                    href="/"
                    className="inline-block px-8 py-3 bg-spider-red text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-spider-red/80 transition-colors"
                >
                    Return Home
                </Link>
            </motion.div>
        </main>
    );
}
