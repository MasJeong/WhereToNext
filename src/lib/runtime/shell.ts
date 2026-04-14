function normalizeBooleanFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

const DEFAULT_SHELL_ORIGIN = "capacitor://localhost";

function getAllowedShellOrigins(): string[] {
  const configuredOrigins = process.env.IOS_SHELL_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : [DEFAULT_SHELL_ORIGIN];
}

/**
 * Indicates whether the app is rendering in the limited iOS acquisition shell mode.
 * @returns true when shell-only navigation constraints should apply
 */
export function isIosShellMode(): boolean {
  return normalizeBooleanFlag(process.env.NEXT_PUBLIC_IOS_SHELL);
}

export function isTrustedIosShellRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && getAllowedShellOrigins().includes(origin));
}
