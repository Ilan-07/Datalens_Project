export interface AuthUser {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  username: string;
  emailAddress: string;
  primaryEmailAddress: {
    emailAddress: string;
  };
  imageUrl: string | null;
  createdAt: string;
}

export interface AuthCredentials {
  fullName?: string;
  username?: string;
  emailAddress: string;
  password?: string;
}

export const AUTH_STORAGE_KEY = "datalens_auth_user";
export const AUTH_TOKEN_STORAGE_KEY = "datalens_auth_token";

export function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeUser(user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function storeToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function createUserFromCredentials(credentials: AuthCredentials): AuthUser {
  const trimmedFullName = credentials.fullName?.trim() || credentials.username?.trim() || "";
  const fallbackName = credentials.emailAddress.split("@")[0] || "DataLens User";
  const fullName = trimmedFullName || fallbackName;
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || fallbackName;
  const lastName = nameParts.slice(1).join(" ");
  const username =
    credentials.username?.trim() ||
    fullName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") ||
    fallbackName.toLowerCase();

  return {
    id: `local_${credentials.emailAddress.toLowerCase()}`,
    fullName,
    firstName,
    lastName,
    username,
    emailAddress: credentials.emailAddress,
    primaryEmailAddress: {
      emailAddress: credentials.emailAddress,
    },
    imageUrl: null,
    createdAt: new Date().toISOString(),
  };
}
