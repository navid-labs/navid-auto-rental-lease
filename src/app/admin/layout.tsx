import { AdminSidebar } from "@/features/admin/components/admin-sidebar";

export const metadata = {
  title: { default: "차용 어드민", template: "%s | 차용 어드민" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add admin role auth check once session integration is complete
  return (
    <html lang="ko">
      <body
        style={{ margin: 0 }}
        className="min-h-screen bg-[var(--chayong-bg)] antialiased"
      >
        <div className="flex min-h-screen">
          <AdminSidebar />
          <main className="flex-1 ml-60 p-6 bg-[var(--chayong-surface)] min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
