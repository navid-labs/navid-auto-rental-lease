const PHONE_PATTERN = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/;
const LOOSE_PHONE_PATTERN = /0\d{1,2}\D{0,4}\d{3,4}\D{0,4}\d{4}/;
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w+/;

const KOREAN_DIGITS: Record<string, string> = {
  영: "0",
  공: "0",
  일: "1",
  이: "2",
  삼: "3",
  사: "4",
  오: "5",
  육: "6",
  칠: "7",
  팔: "8",
  구: "9",
};

function normalizeContactText(text: string): string {
  return text.replace(/[영공일이삼사오육칠팔구]/g, (digit) => KOREAN_DIGITS[digit] ?? digit);
}

export function containsContactInfo(text: string): boolean {
  const normalized = normalizeContactText(text);
  return (
    PHONE_PATTERN.test(normalized) ||
    LOOSE_PHONE_PATTERN.test(normalized) ||
    EMAIL_PATTERN.test(normalized)
  );
}

export type SanitizeResult =
  | { blocked: false; sanitized: string }
  | { blocked: true; reason: string; sanitized: string };

export type MessageReviewDecision = {
  reviewStatus: "APPROVED" | "PENDING_REVIEW" | "BLOCKED";
  blockReason?: "REGEX_CONTACT" | "AI_CONTACT" | "ADMIN_BLOCK";
  sanitized: string;
};

function maskContactInfo(text: string): string {
  const normalized = normalizeContactText(text);
  if (EMAIL_PATTERN.test(normalized)) {
    return text.replace(EMAIL_PATTERN, "[연락처 차단]");
  }
  if (PHONE_PATTERN.test(normalized) || LOOSE_PHONE_PATTERN.test(normalized)) {
    return "[연락처 차단]";
  }
  return text;
}

export function sanitizeMessage(text: string): SanitizeResult {
  if (containsContactInfo(text)) {
    return {
      blocked: true,
      reason: "외부 연락처 공유가 제한됩니다.",
      sanitized: maskContactInfo(text),
    };
  }
  return { blocked: false, sanitized: text };
}

export function decideMessageReview(content: string): MessageReviewDecision {
  if (!containsContactInfo(content)) {
    return { reviewStatus: "APPROVED", sanitized: content };
  }

  const result = sanitizeMessage(content);
  const sanitized = result.sanitized;

  return {
    reviewStatus: "BLOCKED",
    blockReason: "REGEX_CONTACT",
    sanitized,
  };
}
