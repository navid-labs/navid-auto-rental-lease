import { prisma } from '@/lib/db/prisma';

const DEFAULT_PASSWORD = 'admin1234';

export async function verifySettingsPasswordMutation(
  password: string
): Promise<{ success: true } | { error: string }> {
  if (!password) {
    return { error: '비밀번호를 입력해주세요.' };
  }

  const record = await prisma.defaultSetting.findUnique({
    where: { key: 'settings_password' },
  });

  if (record) {
    // Argon2id hashed password: use Bun.password.verify
    if (record.value.startsWith('$argon2')) {
      const isValid = await Bun.password.verify(password, record.value);
      if (!isValid) {
        return { error: '비밀번호가 일치하지 않습니다.' };
      }
      return { success: true };
    }

    // Backwards compatibility: plaintext stored password
    if (password !== record.value) {
      return { error: '비밀번호가 일치하지 않습니다.' };
    }
    return { success: true };
  }

  // No record in DB: compare against default password
  if (password !== DEFAULT_PASSWORD) {
    return { error: '비밀번호가 일치하지 않습니다.' };
  }

  return { success: true };
}
