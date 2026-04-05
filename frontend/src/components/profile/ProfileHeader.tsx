import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Crown, Camera } from "lucide-react";
import Link from "next/link";
import { GlassyButton } from "@/components/ui/GlassyButton";
import { useProjectStore } from "@/store/projectStore";
import { HaloBanner } from "@/components/profile/HaloBanner";
import { useAuth, useUser } from "@/hooks/useAuth";

interface StatItem {
    label: string;
    value: number;
}

export const ProfileHeader: React.FC = () => {
    const { user } = useUser();
    const { updateProfileImage } = useAuth();
    const { projects } = useProjectStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // ── Local Auth User Data ────────────────────────────────
    const displayName = user?.fullName || user?.firstName || "DataLens User";
    const username =
        user?.username ||
        user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
        "user";
    const avatarUrl = avatarPreview || user?.imageUrl || null;
    const initials = displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        })
        : "February 2026";

    const emailAddress =
        user?.primaryEmailAddress?.emailAddress || "user@datalens.ai";

    const stats: StatItem[] = [
        { label: "Datasets Uploaded", value: projects.length },
        { label: "Analyses Run", value: projects.length },
        {
            label: "Insights Generated",
            value: projects.reduce(
                (acc, p) => acc + (p.analysisData?.insights?.length || 3),
                0
            ),
        },
        { label: "Reports Exported", value: Math.floor(projects.length * 0.6) },
    ];

    // ── Profile Picture Upload ───────────────────────────────
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
            setAvatarPreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Keep the local avatar in sync with the rest of the app shell
        if (user) {
            try {
                await updateProfileImage(file);
            } catch (err) {
                console.error("Failed to update profile image:", err);
            }
        }
    };

    return (
        <div className="profile-header-root">
            {/* ── Cover Area with Halo Effect ─────────────────────── */}
            <div className="profile-header-cover">
                {/* Dynamic Halo Banner */}
                <HaloBanner
                    colors={["#B11226", "#5A0E16", "#1a0a2e"]}
                    sources={6}
                    speed={0.3}
                />

                {/* Subtle noise overlay for texture */}
                <div className="profile-header-overlay opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIxIi8+PC9zdmc+')]" />

                {/* Bottom fade to black */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />

                {/* Top actions */}
                <div className="profile-header-top-actions">
                    <Link
                        href="/"
                        className="profile-header-action"
                    >
                        <ArrowLeft size={16} className="text-white" />
                    </Link>
                    <Link
                        href="#settings"
                        className="profile-header-action"
                    >
                        <Settings size={16} className="text-white" />
                    </Link>
                </div>
            </div>

            {/* ── Avatar + Info Block ──────────────────────────────── */}
            <div className="profile-header-shell">
                {/* Avatar — overlapping the cover */}
                <div className="profile-header-avatar-row">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="profile-header-avatar-wrap group"
                    >
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />

                        {/* Avatar circle */}
                        <div
                            onClick={handleAvatarClick}
                            className="profile-header-avatar"
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-spider-red/80 to-spider-shadow flex items-center justify-center">
                                    <span className="text-3xl md:text-4xl font-heading font-black text-white tracking-wider">
                                        {initials}
                                    </span>
                                </div>
                            )}

                            {/* Camera overlay on hover */}
                            <div className="profile-header-avatar-overlay">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>

                        {/* Online indicator */}
                        <div className="profile-header-online" />
                    </motion.div>

                    {/* Info + Actions */}
                    <div className="profile-header-info-row">
                        {/* User Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.5 }}
                            className="profile-header-copy"
                        >
                            <h1 className="profile-header-name">
                                {displayName}
                            </h1>
                            <p className="profile-header-handle">
                                @{username}
                            </p>
                            <p className="profile-header-email">
                                {emailAddress}
                            </p>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.5 }}
                            className="profile-header-actions"
                        >
                            <button
                                onClick={handleAvatarClick}
                                className="profile-header-action-secondary"
                            >
                                Edit Profile
                            </button>
                            <GlassyButton
                                variant="cta"
                                className="text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2"
                            >
                                <Crown size={12} />
                                Upgrade to Pro
                            </GlassyButton>
                        </motion.div>
                    </div>
                </div>

                {/* Metadata Line */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="profile-header-meta"
                >
                    <span>Member since {memberSince}</span>
                    <span className="hidden md:inline text-white/10">·</span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-spider-red" />
                        Plan: <span className="text-white font-bold">Pro</span>
                    </span>
                    <span className="hidden md:inline text-white/10">·</span>
                    <span>
                        AI Credits:{" "}
                        <span className="text-white font-bold">240</span>
                    </span>
                </motion.div>

                {/* ── Stats Row ────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="profile-header-stats"
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="profile-header-stat"
                        >
                            <span className="profile-header-stat-value">
                                {stat.value}
                            </span>
                            <span className="profile-header-stat-label">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
