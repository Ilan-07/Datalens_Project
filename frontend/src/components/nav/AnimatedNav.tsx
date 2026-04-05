import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GlitchText } from '@/engine/text/GlitchText';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GlassyButton } from '@/components/ui/GlassyButton';
import { useAuth, useUser } from '@/hooks/useAuth';

import { FluidNavItem } from './FluidNavItem';
import { BrandWordmark } from './BrandWordmark';
import { NAV_LINKS } from '@/data/navigationLinks';

export const AnimatedNav = () => {
    const pathname = usePathname();
    const isLandingPage = pathname === '/';
    const [scrolled, setScrolled] = useState(false);
    const { isSignedIn, signOut } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        if (!isLandingPage) return;

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check initial state

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLandingPage]);

    // Construct the wrapper classes based on state
    const navClasses = isLandingPage
        ? cn(
            "animated-nav animated-nav-state-landing",
            scrolled ? "animated-nav-state-scrolled" : "animated-nav-state-top"
        )
        : "animated-nav animated-nav-state-inner";

    return (
        <nav className={navClasses}>
            {/* Glass panel pseudo-reflection layer (Landing Page only) */}
            {isLandingPage && (
                <div
                    className="animated-nav-glass-layer"
                    style={{ backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02), transparent)' }}
                />
            )}

            {/* Content Container ensures z-index stays above the reflection layer */}
            <div className="animated-nav-content">
                {/* Logo Section */}
                <div className="animated-nav-logo">
                    <div className="animated-nav-logo-anim">
                        <BrandWordmark
                            headingTag="h1"
                            showTagline
                            titleClassName="text-xl"
                            taglineClassName="text-[9px] tracking-[0.3em]"
                        />
                    </div>
                </div>

                {/* Center Navigation */}
                <div className="flex-1 flex items-center justify-center gap-2">
                    {/* Desktop: Expanding Items */}
                    <div className="hidden md:flex items-center justify-center gap-3">
                        {NAV_LINKS.map((link) => (
                            <FluidNavItem
                                key={link.id}
                                id={link.id}
                                label={link.label}
                                href={link.href}
                                icon={link.icon}
                            />
                        ))}
                    </div>

                    {/* Mobile Fallback */}
                    <div className="flex md:hidden items-center justify-center gap-2">
                        {NAV_LINKS.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={`mobile-${link.id}`}
                                    href={link.href}
                                    className="animated-nav-mobile-link"
                                >
                                    <Icon className="w-4 h-4 text-dim" strokeWidth={1.5} />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {!isSignedIn ? (
                        <>
                            <Link href="/sign-in" className="animated-nav-auth-link">
                                Sign In
                            </Link>
                            <GlassyButton variant="cta" href="/sign-up" className="text-[10px] font-bold uppercase tracking-[0.2em]">
                                <GlitchText>Get Started</GlitchText>
                            </GlassyButton>
                        </>
                    ) : (
                        <>
                            <Link href="/profile">
                                <button className="animated-nav-avatar-button group">
                                    {user?.imageUrl ? (
                                        <img src={user.imageUrl} alt={user.fullName} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="mb-0.5 text-[10px] font-bold text-white group-hover:text-spider-red">
                                            {(user?.firstName || "P").slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                </button>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="animated-nav-auth-link"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
