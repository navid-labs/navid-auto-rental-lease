const SAFE_PATH = /^\/[A-Za-z0-9_\-/]*$/;

export function sanitizeNextPath(input: string | null | undefined): string {
  if (!input) return "/";
  if (input.startsWith("//")) return "/";
  if (!SAFE_PATH.test(input)) return "/";
  return input;
}
