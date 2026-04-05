import React from "react";

import { AuthRoutePage } from "@/components/shared/auth/AuthRoutePage";

export function SignInPage() {
  return <AuthRoutePage mode="sign-in" />;
}

export function SignUpPage() {
  return <AuthRoutePage mode="sign-up" />;
}
