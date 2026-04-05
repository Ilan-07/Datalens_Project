/**
 * Manages per-user session data scoping.
 *
 * On sign-out the active stores are saved under a user-specific prefix
 * and then cleared, so nothing is visible while signed out.
 *
 * On sign-in the previously saved data is restored for that user.
 */

const ANALYSIS_KEY = "datalens-analysis-storage";
const PROJECTS_KEY = "datalens-projects-storage";
const SETTINGS_KEY = "datalens-settings-storage";
const ACTIVE_SESSION_KEY = "datalens_active_session";

const SCOPED_KEYS = [ANALYSIS_KEY, PROJECTS_KEY, ACTIVE_SESSION_KEY] as const;

function userKey(userId: string, baseKey: string) {
  return `datalens_user:${userId}:${baseKey}`;
}

/** Persist current store data under the user's namespace, then wipe shared keys. */
export function saveAndClearSessionData(userId: string) {
  for (const key of SCOPED_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      localStorage.setItem(userKey(userId, key), value);
    }
    localStorage.removeItem(key);
  }
}

/** Restore a user's previously saved data back into the shared keys. */
export function restoreSessionData(userId: string) {
  for (const key of SCOPED_KEYS) {
    const value = localStorage.getItem(userKey(userId, key));
    if (value !== null) {
      localStorage.setItem(key, value);
    } else {
      // No prior data for this user — ensure the key is clean
      localStorage.removeItem(key);
    }
  }
}
