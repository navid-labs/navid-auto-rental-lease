// Protected route group layout.
// Auth guard will be added here once Supabase session integration is complete.
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
