import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  AuthCredentials,
  AuthUser,
  readStoredUser,
  readStoredToken,
  storeUser,
  storeToken,
} from "@/services/auth";
import { signInWithApi, signOutWithApi, signUpWithApi } from "@/services/authApi";
import { saveAndClearSessionData, restoreSessionData } from "@/services/sessionData";
import { useAnalysisStore } from "@/store/analysisStore";
import { useProjectStore } from "@/store/projectStore";

interface AuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  getToken: () => Promise<string | null>;
  signIn: (credentials: AuthCredentials) => Promise<AuthUser>;
  signUp: (credentials: AuthCredentials) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  updateProfileImage: (file: File) => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialUser() {
  return readStoredUser();
}

function readInitialToken() {
  return readStoredToken();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readInitialUser);
  const [token, setToken] = useState<string | null>(readInitialToken);
  const isLoaded = true;

  useEffect(() => {
    if (token && token.startsWith("local:")) {
      setUser(null);
      setToken(null);
    }
  }, [token]);

  useEffect(() => {
    storeUser(user);
  }, [user]);

  useEffect(() => {
    storeToken(token);
  }, [token]);

  const resetAnalysis = useAnalysisStore((s) => s.reset);
  const resetProjects = useProjectStore((s) => s.deleteAllProjects);

  const value = useMemo<AuthContextValue>(() => {
    const setSession = (nextUser: AuthUser | null, nextToken: string | null) => {
      setUser(nextUser);
      setToken(nextToken);
    };

    return {
      isLoaded,
      isSignedIn: Boolean(user && token),
      user,
      getToken: async () => token,
      signIn: async (credentials) => {
        const result = await signInWithApi(credentials);
        setSession(result.user, result.token);
        // Restore this user's previously saved session data
        restoreSessionData(result.user.id);
        // Rehydrate zustand stores from the restored localStorage
        useAnalysisStore.persist.rehydrate();
        useProjectStore.persist.rehydrate();
        return result.user;
      },
      signUp: async (credentials) => {
        const result = await signUpWithApi(credentials);
        setSession(result.user, result.token);
        // New user — clear any stale data and start fresh
        restoreSessionData(result.user.id);
        useAnalysisStore.persist.rehydrate();
        useProjectStore.persist.rehydrate();
        return result.user;
      },
      signOut: async () => {
        // Save current session data under this user's namespace before clearing
        if (user) {
          saveAndClearSessionData(user.id);
        }
        // Reset in-memory zustand stores so UI goes blank immediately
        resetAnalysis();
        resetProjects();
        await signOutWithApi(token);
        setSession(null, null);
      },
      updateProfileImage: async (file) => {
        if (!user) {
          return null;
        }

        const imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve((event.target?.result as string) || "");
          };
          reader.onerror = () => reject(new Error("Unable to read profile image."));
          reader.readAsDataURL(file);
        });

        const nextUser = { ...user, imageUrl };
        setSession(nextUser, token);
        return nextUser;
      },
    };
  }, [isLoaded, token, user, resetAnalysis, resetProjects]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}

export function useUser() {
  const { isLoaded, user } = useAuth();
  return { isLoaded, user };
}
