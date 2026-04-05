import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import HomePage from "@/app/page";
import AnalysisRecoveryPage from "@/app/analysis/page";
import AnalysisDashboardPage from "@/app/analysis/[sessionId]/page";
import DatasetPage from "@/app/dataset/page";
import InsightsPage from "@/app/insights/page";
import ProfilePage from "@/app/profile/page";
import { AboutPage, BlogPage, ContactPage } from "@/app/info/InfoPages";
import { SignInPage, SignUpPage } from "@/app/auth/AuthPages";
import NotFoundPage from "@/app/not-found/NotFoundPage";

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};

export function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />

          <Route path="/analysis" element={<AnalysisRecoveryPage />} />
          <Route path="/analysis/new" element={<Navigate to="/dataset" replace />} />
          <Route path="/analysis/:sessionId" element={<AnalysisDashboardPage />} />

          <Route path="/dataset" element={<DatasetPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />

          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
