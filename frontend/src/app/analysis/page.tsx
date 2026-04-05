import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Database } from "lucide-react";
import { getPersistedActiveSession } from "@/services/analysisService";

export default function AnalysisRecoveryPage() {
    const router = useRouter();

    useEffect(() => {
        const recoverSession = () => {
            const savedSession = getPersistedActiveSession();

            if (savedSession) {
                toast.success("Active session recovered.");
                router.replace(`/analysis/${savedSession}`);
            } else {
                toast.info("No active session. Redirecting to dataset page.");
                router.replace("/dataset");
            }
        };

        // Mild delay to prevent visual jump and allow local storage hydration
        const timer = setTimeout(recoverSession, 500);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <main className="recovery-root">
            <div className="recovery-card">
                <Database size={32} className="text-spider-red animate-pulse" />
                <div className="space-y-2 text-center">
                    <h1 className="text-white font-heading font-black tracking-widest uppercase">
                        Scanning Memory
                    </h1>
                    <p className="text-dim text-[10px] uppercase tracking-[0.4em] font-bold">
                        Locating persistent session data...
                    </p>
                </div>
            </div>

            {/* Background Grid */}
            <div className="recovery-grid" />
        </main>
    );
}
