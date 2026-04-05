function normalizeBooleanFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * Indicates whether the app is rendering in the limited iOS acquisition shell mode.
 * @returns true when shell-only navigation constraints should apply
 */
export function isIosShellMode(): boolean {
  return normalizeBooleanFlag(process.env.NEXT_PUBLIC_IOS_SHELL);
}
