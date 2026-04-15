import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { getProfile } from "@/lib/supabase/auth";

export const metadata = {
  title: { default: "차용 어드민", template: "%s | 차용 어드민" },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role !== "ADMIN") redirect("/");

  return (
    <>
      {/* Hide root layout's Header, Footer, MobileNav */}
      <style>{`
        body > header, body > footer, body > nav,
        body > main > header, body > main > footer {
          display: none !important;
        }
        body > main {
          padding-bottom: 0 !important;
        }
      `}</style>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 ml-60 p-6 bg-[var(--chayong-surface)] min-h-screen">
          {children}
        </main>
      </div>
    </>
  );
}
