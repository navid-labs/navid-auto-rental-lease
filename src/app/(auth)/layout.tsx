export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
