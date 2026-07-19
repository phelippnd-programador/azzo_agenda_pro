type RuntimeEnvKey = keyof RuntimeEnv;

export function getEnv(key: RuntimeEnvKey): string | undefined {
  const runtimeValue = window.__ENV__?.[key];

  if (
    runtimeValue !== undefined &&
    runtimeValue !== null &&
    runtimeValue !== ""
  ) {
    return runtimeValue;
  }

  return import.meta.env[key];
}

export function getBooleanEnv(
  key: RuntimeEnvKey,
  defaultValue = false
): boolean {
  const value = getEnv(key);

  if (value === undefined || value.trim() === "") {
    return defaultValue;
  }

  return value.trim().toLowerCase() === "true";
}