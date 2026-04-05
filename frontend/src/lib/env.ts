type LegacyProcessEnv = {
  NEXT_PUBLIC_API_URL?: string;
};

function readLegacyEnv(): LegacyProcessEnv {
  const processLike = (globalThis as { process?: { env?: LegacyProcessEnv } }).process;
  return processLike?.env ?? {};
}

const legacyEnv = readLegacyEnv();

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  legacyEnv.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";
