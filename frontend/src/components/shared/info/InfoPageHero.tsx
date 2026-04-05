import React from "react";
import { motion } from "framer-motion";

import { GlitchWrapper } from "@/components/GlitchWrapper";
import { DepthTypography } from "@/engine/DepthTypography";
import { ChromaticText } from "@/components/ui/ChromaticText";

type HeroDepth = "sm" | "md" | "lg" | "xl";

interface InfoPageHeroProps {
  badge: string;
  title: string;
  subtitle?: string;
  depth?: HeroDepth;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function InfoPageHero({
  badge,
  title,
  subtitle,
  depth = "xl",
  titleClassName = "text-6xl md:text-[7rem]",
  subtitleClassName = "text-dim max-w-xl text-sm tracking-widest leading-relaxed uppercase opacity-50",
}: InfoPageHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="info-hero-motion"
    >
      <div className="info-hero-badge">
        <ChromaticText text={badge} intensity={5} />
      </div>

      <GlitchWrapper trigger="always" className="info-hero-title-wrap">
        <DepthTypography as="h1" depth={depth} className={titleClassName}>
          {title}
        </DepthTypography>
      </GlitchWrapper>

      {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
    </motion.div>
  );
}
