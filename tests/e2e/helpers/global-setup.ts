import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import * as path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const STORAGE_PATH = path.join(__dirname, "..", ".auth", "admin.json");

export default async function globalSetup() {
  const {
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_PASSWORD,
    SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL,
  } = process.env;

  if (
    !TEST_ADMIN_EMAIL ||
    !TEST_ADMIN_PASSWORD ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !NEXT_PUBLIC_SUPABASE_URL
  ) {
    throw new Error(
      "Missing .env.test: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  const supabaseAdmin = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // idempotent — 유저 존재 시 비밀번호 업데이트, 없으면 생성
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === TEST_ADMIN_EMAIL);
  let userId: string;
  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: TEST_ADMIN_PASSWORD,
    });
    if (error) throw error;
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;
  }

  // Profile 테이블에 ADMIN 역할 upsert
  const prisma = new PrismaClient();
  await prisma.profile.upsert({
    where: { id: userId },
    update: { role: "ADMIN" },
    create: {
      id: userId,
      email: TEST_ADMIN_EMAIL,
      role: "ADMIN",
    },
  });
  await prisma.$disconnect();

  // 브라우저로 로그인 후 storageState 저장
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/login");
  await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
  await page.fill('input[name="password"]', TEST_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(?!login)/, { timeout: 15000 });

  await page.context().storageState({ path: STORAGE_PATH });
  await browser.close();
}
