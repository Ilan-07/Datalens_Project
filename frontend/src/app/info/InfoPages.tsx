import React from "react";
import { motion } from "framer-motion";

import { FloatingParticles } from "@/components/about/FloatingParticles";
import { TextScrollReveal } from "@/components/about/TextScrollReveal";
import { FlowStack, FlowCardProps } from "@/components/FlowStack";
import { ParticleNoiseBackground } from "@/components/ui/ParticleNoiseBackground";
import { FolderOpenUp } from "@/components/contact/FolderOpenUp";
import { ChromaticText } from "@/components/ui/ChromaticText";
import { InfoPageLayout } from "@/components/shared/info/InfoPageLayout";

const ABOUT_TEXT_1 = `DataLens is an immersive AI-powered data intelligence system designed to transform traditional analytics into spatial, intuitive experiences. By combining machine intelligence, dynamic visualization, and cinematic interface design, DataLens redefines how organizations interact with complex information.`;

const ABOUT_TEXT_2 = `Our platform moves beyond dashboards — it creates environments where data becomes dimensional, responsive, and context-aware. Through intelligent modeling, real-time simulation, and adaptive systems, DataLens empowers users to explore insights naturally and make decisions with clarity and confidence.`;

const ABOUT_TEXT_3 = `At its core, DataLens is not just an analytics tool — it is a next-generation intelligence interface built for the evolving digital landscape.`;

const flowCards: FlowCardProps[] = [
  {
    title: "Lightning Fast Insights",
    description:
      "Turn raw data into meaningful intelligence in seconds. DataLens processes complex datasets instantly, surfacing patterns, anomalies, and trends that would otherwise remain hidden.",
    cta: "Explore Real-Time Analytics →",
    icon: "LightningBolt",
  },
  {
    title: "Secure Data Vaults",
    description:
      "DataLens isolates and encrypts every dataset using modern security practices, ensuring privacy, integrity, and compliance across all workflows.",
    cta: "Learn About Security →",
    icon: "ShieldCheck",
  },
  {
    title: "AI Automation",
    description:
      "DataLens uses machine learning to automatically detect trends, summarize insights, and generate actionable reports.",
    cta: "Discover AI Automation →",
    icon: "Robot",
  },
  {
    title: "Scale Forever",
    description:
      "Built on cloud-native infrastructure, DataLens scales effortlessly as your data ecosystem grows.",
    cta: "See How It Scales →",
    icon: "Rocket",
  },
];

export function AboutPage() {
  return (
    <InfoPageLayout
      badge="About DataLens"
      title="About"
      depth="xl"
      rootClassName="info-about-root"
      contentClassName="info-about-content"
      heroSectionClassName="info-about-hero"
      subtitle="The intelligence behind the interface"
      subtitleClassName="info-about-subtitle"
      backgroundLayer={<div className="info-about-background" />}
      ambientLayer={
        <div className="info-about-particles">
          <FloatingParticles count={80} mobileCount={40} />
        </div>
      }
    >
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="info-about-brand-section"
      >
        <h2 className="info-about-brand-title">
          <ChromaticText text="DataLens™" intensity={2} />
        </h2>
      </motion.section>

      <section className="info-about-copy-shell">
        <div className="info-about-copy-stack">
          <TextScrollReveal
            text={ABOUT_TEXT_1}
            className="info-about-paragraph"
            wordsPerChunk={6}
          />

          <TextScrollReveal
            text={ABOUT_TEXT_2}
            className="info-about-paragraph"
            wordsPerChunk={6}
          />

          <TextScrollReveal
            text={ABOUT_TEXT_3}
            className="info-about-paragraph info-about-paragraph-emphasis"
            wordsPerChunk={5}
          />
        </div>
      </section>

      <div className="info-about-footer">
        <div className="info-about-divider" />
        <p className="info-about-hint">Scroll to explore</p>
      </div>
    </InfoPageLayout>
  );
}

export function BlogPage() {
  return (
    <InfoPageLayout
      badge="Insights & Updates"
      title="The DataLens Blog"
      depth="lg"
      rootClassName="info-blog-root"
      heroSectionClassName="info-blog-hero"
      subtitle="Dive deep into the architecture, features, and vision driving the future of data intelligence."
      subtitleClassName="info-blog-subtitle"
      ambientLayer={<ParticleNoiseBackground opacity={0.15} />}
    >
      <div className="info-blog-divider" />

      <section className="info-blog-feature-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="info-blog-heading-group"
        >
          <h2 className="info-blog-title">Why DataLens Powers Modern Analytics</h2>
          <p className="info-blog-description">
            A seamless blend of speed, security, and intelligence designed to elevate your data workflows.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <FlowStack cards={flowCards} />
        </motion.div>
      </section>
    </InfoPageLayout>
  );
}

export function ContactPage() {
  return (
    <InfoPageLayout
      badge="Identity & Contact"
      title="Contact"
      depth="xl"
      rootClassName="info-contact-root"
      heroSectionClassName="info-contact-hero"
      subtitle="Open the dimensional folder to reveal our identity across realities"
      subtitleClassName="info-contact-subtitle"
    >
      <section className="info-contact-folder-shell">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        >
          <FolderOpenUp />
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="info-contact-hint-shell"
      >
        <p className="info-contact-hint">Hover to peek · Click to reveal · Explore identity cards</p>
      </motion.div>
    </InfoPageLayout>
  );
}
