import React from "react";
import Link from "next/link";
import { FOOTER_LINKS } from "@/data/navigationLinks";
import { BrandWordmark } from "./BrandWordmark";

export const GlobalFooter: React.FC = () => {
    // Render footer globally

    return (
        <footer className="global-footer">
            <div className="global-footer-shell">
                {/* Main Footer Grid */}
                <div className="global-footer-grid">
                    {/* Brand Column */}
                    <div className="global-footer-brand">
                        <BrandWordmark headingTag="h3" titleClassName="text-lg mb-3" />
                        <p className="global-footer-brand-text">
                            AI-powered data analysis for smarter decisions. Transform raw data into
                            executive-ready insights.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div className="global-footer-col-product">
                        <h4 className="global-footer-heading">
                            Product
                        </h4>
                        <ul className="global-footer-list">
                            {FOOTER_LINKS.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="global-footer-link"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div className="global-footer-col">
                        <h4 className="global-footer-heading">
                            Resources
                        </h4>
                        <ul className="global-footer-list">
                            {FOOTER_LINKS.resources.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="global-footer-link"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="global-footer-col">
                        <h4 className="global-footer-heading">
                            Company
                        </h4>
                        <ul className="global-footer-list">
                            {FOOTER_LINKS.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="global-footer-link"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="global-footer-bottom">
                    <span className="global-footer-copyright">
                        © 2026 DataLens. All rights reserved.
                    </span>
                    <div className="global-footer-status">
                        <span className="global-footer-status-dot" />
                        <span className="global-footer-status-text">
                            Systems Online
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
