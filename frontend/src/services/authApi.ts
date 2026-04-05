import { api } from "@/services/api";
import { AuthCredentials, AuthUser, createUserFromCredentials } from "@/services/auth";

interface AuthResult {
  user: AuthUser;
  token: string;
}

function mergeApiUser(credentials: AuthCredentials, payload: unknown): AuthUser {
  const fallbackUser = createUserFromCredentials(credentials);

  if (!payload || typeof payload !== "object") {
    return fallbackUser;
  }

  const partial = payload as Partial<AuthUser>;
  return {
    ...fallbackUser,
    ...partial,
    primaryEmailAddress: {
      emailAddress:
        partial.primaryEmailAddress?.emailAddress ||
        partial.emailAddress ||
        fallbackUser.emailAddress,
    },
  };
}

function normalizeToken(candidate: unknown, fallbackUser: AuthUser) {
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate;
  }

  throw new Error("Authentication token missing in server response.");
}

function normalizeAuthError(error: unknown): Error {
  const fallbackMessage = "Authentication request failed.";

  if (!error || typeof error !== "object") {
    return new Error(fallbackMessage);
  }

  const maybeResponse = (error as { response?: { data?: { error?: { message?: string } } } }).response;
  const backendMessage = maybeResponse?.data?.error?.message;
  if (backendMessage) {
    return new Error(backendMessage);
  }

  const message = (error as { message?: string }).message;
  return new Error(message || fallbackMessage);
}

export async function signInWithApi(credentials: AuthCredentials): Promise<AuthResult> {
  try {
    const response = await api.post("/api/auth/sign-in", credentials);
    const user = mergeApiUser(credentials, response.data?.user ?? response.data);
    const token = normalizeToken(response.data?.token, user);
    return { user, token };
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function signUpWithApi(credentials: AuthCredentials): Promise<AuthResult> {
  try {
    const response = await api.post("/api/auth/sign-up", credentials);
    const user = mergeApiUser(credentials, response.data?.user ?? response.data);
    const token = normalizeToken(response.data?.token, user);
    return { user, token };
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function signOutWithApi(token: string | null): Promise<void> {
  if (!token) {
    return;
  }

  try {
    await api.post("/api/auth/sign-out", {});
  } catch {
    // Best-effort API sign-out; local session still clears.
  }
}
