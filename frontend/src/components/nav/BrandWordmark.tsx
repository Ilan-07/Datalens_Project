import React from "react";
import Link from "next/link";

type HeadingTag = "h1" | "h2" | "h3" | "p";

interface BrandWordmarkProps {
  headingTag?: HeadingTag;
  showTagline?: boolean;
  className?: string;
  titleClassName?: string;
  taglineClassName?: string;
  href?: string;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  headingTag = "h1",
  showTagline = false,
  className = "",
  titleClassName = "",
  taglineClassName = "",
  href = "/",
}) => {
  const Heading = headingTag;

  const content = (
    <>
      <Heading
        className={`text-white font-heading font-black uppercase tracking-widest leading-none ${titleClassName}`.trim()}
      >
        Data<span className="text-spider-red">Lens</span>
      </Heading>
      {showTagline ? (
        <span className={`text-dim font-mono opacity-50 ${taglineClassName}`.trim()}>
          AI Analytics
        </span>
      ) : null}
    </>
  );

  return (
    <Link href={href} className={`flex flex-col ${className}`.trim()}>
      {content}
    </Link>
  );
};