import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { UploadZone } from "@/components/upload/UploadZone";
import { GlitchWrapper } from "@/components/GlitchWrapper";
import { useAnalysisStore } from "@/store/analysisStore";
import { useProjectStore } from "@/store/projectStore";
import { DepthTypography } from "@/engine/DepthTypography";
import { useMultiverse } from "@/engine/MultiverseProvider";
import { GlitchText } from "@/engine/text/GlitchText";
import { HowItWorks } from "@/components/home/HowItWorks";
import { useAuth } from "@/hooks/useAuth";

import { ChromaticText } from "@/components/ui/ChromaticText";
import { GlassyButton } from "@/components/ui/GlassyButton";
import { ScrollReactiveLogoCarousel } from "@/components/ui/ScrollReactiveLogoCarousel";
import {
  persistActiveSession,
  uploadDataset,
} from "@/services/analysisService";


// ── Feature Data ──────────────────────────────────────────────────────
const features = [
  {
    icon: "📊",
    title: "Automated Analysis",
    description:
      "Run intelligent statistical and exploratory analysis on your data in seconds.",
    href: "#upload",
  },
  {
    icon: "📁",
    title: "Smart Dataset Management",
    description:
      "Upload, organize, and manage datasets with structured clarity.",
    href: "/dataset",
  },
  {
    icon: "💡",
    title: "Actionable Insights",
    description:
      "Turn raw numbers into executive-ready insights powered by AI.",
    href: "/insights",
  },
];

export default function Home() {
  const { isSignedIn } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [problemStatement, setProblemStatement] = useState("");
  const router = useRouter();
  const { setAnalysisData } = useAnalysisStore();
  const { saveProject } = useProjectStore();
  const {
    triggerEnergyBuild,
    triggerStable,
    triggerTear,
    state,
    cinematicMode,
    fps,
    setCinematicMode,
  } = useMultiverse();

  // Parallax Setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const handleUpload = async (file: File) => {
    if (!isSignedIn) {
      toast.error("Reality restricted. Please sign in to analyze datasets.");
      router.push("/sign-in");
      return;
    }

    setIsUploading(true);
    triggerEnergyBuild("upload_start");

    try {
      const report = await uploadDataset({
        file,
        problemStatement,
      });

      triggerTear("analysis_complete");
      toast.success("Reality breached... Analysis incoming.");

      setAnalysisData(report);
      persistActiveSession(report.session_id);
      saveProject(report);

      setTimeout(() => {
        router.push(`/analysis/${report.session_id}`);
      }, 1200);
    } catch (error) {
      console.error("Transmission failed", error);
      toast.error("Dimensional uplink failed. Try again.");
      triggerStable("upload_error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="home-root">
      {/* Cinematic Mode Toggle */}
      <div className="home-cinematic-toggle">
        <button
          onClick={() => setCinematicMode(!cinematicMode)}
          className="px-3 py-1.5 border border-spider-shadow text-[9px] font-bold uppercase tracking-[0.2em] text-dim hover:text-white hover:border-spider-red/40 transition-all cursor-pointer"
        >
          {cinematicMode ? "◉" : "○"} <GlitchText>Cinematic</GlitchText>
        </button>

        {cinematicMode && (
          <span className="text-[9px] font-mono text-dim/40">
            {fps}fps · {state}
          </span>
        )}
      </div>

      {/* Background Parallax Glow */}
      <motion.div style={{ x: springX, y: springY }} className="home-parallax-glow" />

      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: HERO
          ════════════════════════════════════════════════════════════════ */}
      <section className="home-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <div className="home-hero-badge">
            <ChromaticText text="AI-Powered Data Platform" intensity={5} />
          </div>

          {/* DepthTypography Brand Name */}
          <GlitchWrapper trigger="always" className="mb-6 block">
            <DepthTypography
              as="h1"
              depth="xl"
              className="text-7xl md:text-[9rem]"
            >
              DataLens
            </DepthTypography>
          </GlitchWrapper>

          {/* Headline */}
          <h2 className="home-hero-headline font-[family-name:var(--font-dm-serif)]">
            AI-Powered Data Analysis for Modern Teams
          </h2>

          {/* Subheadline */}
          <p className="home-hero-copy">
            Upload datasets, run automated analysis, and uncover actionable
            insights — all in one intelligent workspace.
          </p>

          {/* CTA Buttons */}
          <div className="home-cta-row">
            <GlassyButton
              variant="cta"
              href="#upload"
              className="text-sm font-bold uppercase tracking-[0.15em] px-8 py-3"
            >
              Start Analyzing for Free
            </GlassyButton>
            <button
              onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}
              className="home-secondary-cta px-8 py-3 cursor-pointer"
            >
              View Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: TRUST STRIP
          ════════════════════════════════════════════════════════════════ */}
      <section className="home-trust-strip">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-[20px] md:text-[24px] font-semibold text-white/90 mb-[40px]">
            Trusted for smarter data decisions
          </h3>
          <ScrollReactiveLogoCarousel />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3: FEATURES
          ════════════════════════════════════════════════════════════════ */}
      <section id="features" className="home-section">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="home-section-heading font-[family-name:var(--font-dm-serif)]">
              Deep Data Intelligence for Modern Work
            </h2>
            <p className="home-section-copy text-base md:text-lg">
              Transform complex datasets into clear, confident decisions.
            </p>
          </motion.div>

          {/* 3-Column Grid */}
          <div className="home-feature-grid">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                onClick={() => {
                  if (feature.href.startsWith('#')) {
                    document.querySelector(feature.href)?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    router.push(feature.href);
                  }
                }}
                className="group cursor-pointer"
              >
                <GlitchWrapper className="w-full">
                  <div className="home-feature-card">
                    {/* Decorative corner */}
                    <div className="home-feature-corner top-0 left-0 border-t border-l group-hover:border-spider-red" />
                    <div className="home-feature-corner bottom-0 right-0 border-b border-r group-hover:border-spider-red" />

                    <span className="text-3xl mb-5 block">{feature.icon}</span>
                    <h3 className="text-white font-heading font-bold text-lg uppercase tracking-widest mb-4 group-hover:text-spider-red transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-dim text-sm leading-relaxed font-light">
                      {feature.description}
                    </p>
                  </div>
                </GlitchWrapper>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 4: UPLOAD DATASET SPOTLIGHT
          ════════════════════════════════════════════════════════════════ */}
      <section id="upload" className="home-upload-shell">
        <div className="home-upload-panel">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="dataset-hero-heading font-[family-name:var(--font-dm-serif)]">
              Start with Your Data
            </h2>
            <p className="home-section-copy text-base md:text-lg">
              Upload your dataset and let DataLens uncover what matters.
            </p>
          </motion.div>

          {/* Problem Statement */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <label className="home-upload-label">
              <GlitchText>Problem Statement</GlitchText>
            </label>
            <div className="relative w-full">
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                onFocus={() => triggerEnergyBuild("textarea_focus")}
                onBlur={() => triggerStable("textarea_blur")}
                placeholder="Describe your goal... e.g. 'Predict house prices based on features' or 'Classify customer churn'"
                className="home-upload-textarea placeholder:text-dim/40 placeholder:text-[11px]"
              />
              <div className="home-upload-counter">
                {problemStatement.length > 0
                  ? `${problemStatement.length} chars`
                  : "optional"}
              </div>
            </div>
          </motion.div>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onMouseEnter={() => triggerEnergyBuild("upload_hover")}
            onMouseLeave={() => triggerStable("upload_leave")}
          >
            <UploadZone onUpload={handleUpload} isUploading={isUploading} />
          </motion.div>

          {/* CTA Below Upload */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <GlassyButton
              variant="cta"
              href="#upload"
              className="home-upload-cta text-[10px] font-bold uppercase tracking-[0.2em]"
            >
              Upload Dataset
            </GlassyButton>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 5: WORKFLOW STEPS
          ════════════════════════════════════════════════════════════════ */}
      <HowItWorks />

      <div className="h-16 sm:h-20" />
    </main>
  );
}
