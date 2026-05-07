import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "회원가입",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const role = params.role === "SELLER" ? "SELLER" : "BUYER";
  const redirectPath = getSafeRedirect(params.redirect);

  return <SignupForm initialRole={role} redirectPath={redirectPath} />;
}

function getSafeRedirect(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}
