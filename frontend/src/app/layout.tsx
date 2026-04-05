import React from "react";

import "./globals.css";
import "@/styles/glitch.css";
import "@/styles/shared-pages.css";
import "@/styles/reusable-components.css";
import "@/styles/info-pages.css";

import { Toaster } from "sonner";

import { ThemeController } from "@/engine/ThemeController";

// Component Imports
import { MultiverseProvider } from "@/engine/MultiverseProvider";
import { GlobalLightingProvider } from "@/engine/lighting/GlobalLightingProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AnimatedNav } from "@/components/nav/AnimatedNav";
import { SceneDepthWrapper } from "@/components/nav/SceneDepthWrapper";
import { GlobalFooter } from "@/components/nav/GlobalFooter";
import { AuthGate } from "@/components/auth/AuthGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="font-ui antialiased bg-void flex flex-col min-h-screen">
        <AuthGate>
          <MultiverseProvider>
            <ThemeController />
            <GlobalLightingProvider>
              <AnimatedNav />
              <SceneDepthWrapper>
                <div className="flex flex-col flex-1 min-h-screen">
                  <div className="flex-1">{children}</div>
                  <GlobalFooter />
                </div>
              </SceneDepthWrapper>
            </GlobalLightingProvider>
          </MultiverseProvider>
        </AuthGate>
        <Toaster position="bottom-right" theme="dark" richColors />
      </div>
    </AuthProvider>
  );
}
