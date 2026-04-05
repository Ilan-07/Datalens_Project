import {
  BarChart3,
  Brain,
  Database,
  Lightbulb,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface FooterLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { id: "features", label: "Features", href: "/#features", icon: Sparkles },
  { id: "datasets", label: "Datasets", href: "/dataset", icon: Database },
  { id: "analysis", label: "Analysis", href: "/analysis", icon: BarChart3 },
  { id: "insights", label: "Insights", href: "/insights", icon: Lightbulb },
  { id: "training", label: "Training", href: "/training", icon: Brain },
];

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Demo", href: "/analysis" },
  ] satisfies FooterLink[],
  resources: [
    { label: "Blog", href: "/blog" },
  ] satisfies FooterLink[],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ] satisfies FooterLink[],
};