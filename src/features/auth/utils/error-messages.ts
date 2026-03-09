const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다',
  'Email not confirmed': '이메일 인증이 필요합니다',
  'User already registered': '이미 가입된 이메일입니다',
  'Password should be at least 6 characters': '비밀번호는 6자 이상이어야 합니다',
  'Email rate limit exceeded': '잠시 후 다시 시도해주세요',
}

export function getAuthErrorMessage(error: string): string {
  return AUTH_ERROR_MAP[error] ?? '오류가 발생했습니다. 다시 시도해주세요.'
}
