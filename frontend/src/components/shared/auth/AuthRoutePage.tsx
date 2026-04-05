import React from "react";

import { AuthFormPage } from "@/components/shared/auth/AuthFormPage";

type AuthMode = "sign-in" | "sign-up";

const AUTH_PAGE_CONFIG: Record<AuthMode, React.ComponentProps<typeof AuthFormPage>> = {
  "sign-in": {
    mode: "sign-in",
    titleCode: "// Authentication_Required",
    submitIdleLabel: "Enter Workspace",
    submitLoadingLabel: "Opening Session...",
    successMessage: "Session restored.",
    failureMessage: "Unable to open session.",
    fields: [
      {
        key: "fullName",
        label: "Display Name",
        placeholder: "DataLens User",
        autoComplete: "name",
      },
      {
        key: "emailAddress",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "you@example.com",
        autoComplete: "email",
      },
      {
        key: "password",
        label: "Password",
        type: "password",
        required: true,
        placeholder: "••••••••",
        autoComplete: "current-password",
      },
    ],
  },
  "sign-up": {
    mode: "sign-up",
    titleCode: "// New_Agent_Registration",
    submitIdleLabel: "Create Account",
    submitLoadingLabel: "Creating Workspace...",
    successMessage: "Workspace created.",
    failureMessage: "Unable to create session.",
    fields: [
      {
        key: "fullName",
        label: "Display Name",
        placeholder: "DataLens User",
        autoComplete: "name",
      },
      {
        key: "username",
        label: "Username",
        placeholder: "data-lens",
        autoComplete: "username",
      },
      {
        key: "emailAddress",
        label: "Email",
        type: "email",
        required: true,
        placeholder: "you@example.com",
        autoComplete: "email",
      },
      {
        key: "password",
        label: "Password",
        type: "password",
        required: true,
        placeholder: "••••••••",
        autoComplete: "new-password",
      },
    ],
  },
};

export function AuthRoutePage({ mode }: { mode: AuthMode }) {
  return <AuthFormPage {...AUTH_PAGE_CONFIG[mode]} />;
}
