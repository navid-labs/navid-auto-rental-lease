const PHONE_PATTERN = /\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/;
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/;

export function containsContactInfo(text: string): boolean {
  return PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text);
}

type SanitizeResult = { blocked: false } | { blocked: true; reason: string };

export function sanitizeMessage(text: string): SanitizeResult {
  if (containsContactInfo(text)) {
    return { blocked: true, reason: "외부 연락처 공유가 제한됩니다." };
  }
  return { blocked: false };
}
