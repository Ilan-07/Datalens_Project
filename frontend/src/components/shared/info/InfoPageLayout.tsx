import React from "react";
import { cn } from "@/lib/utils";

import { InfoPageHero } from "@/components/shared/info/InfoPageHero";

type HeroDepth = "sm" | "md" | "lg" | "xl";

interface InfoPageLayoutProps {
  badge: string;
  title: string;
  subtitle?: string;
  depth?: HeroDepth;
  rootClassName?: string;
  contentClassName?: string;
  heroSectionClassName?: string;
  subtitleClassName?: string;
  titleClassName?: string;
  backgroundLayer?: React.ReactNode;
  ambientLayer?: React.ReactNode;
  children: React.ReactNode;
}

export function InfoPageLayout({
  badge,
  title,
  subtitle,
  depth = "xl",
  rootClassName,
  contentClassName,
  heroSectionClassName,
  subtitleClassName,
  titleClassName,
  backgroundLayer,
  ambientLayer,
  children,
}: InfoPageLayoutProps) {
  return (
    <main className={cn("info-page-root", rootClassName)}>
      {backgroundLayer}
      {ambientLayer}

      <div className={cn("info-page-content", contentClassName)}>
        <section className={cn("info-page-hero", heroSectionClassName)}>
          <InfoPageHero
            badge={badge}
            title={title}
            subtitle={subtitle}
            depth={depth}
            subtitleClassName={subtitleClassName}
            titleClassName={titleClassName}
          />
        </section>

        {children}
      </div>
    </main>
  );
}
