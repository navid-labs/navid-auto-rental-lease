export function AuthDivider({ label = "또는" }: { label?: string }) {
  return (
    <div className="my-2 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-[var(--chayong-divider)]" />
      <span className="text-xs text-[var(--chayong-text-sub)]">{label}</span>
      <span className="h-px flex-1 bg-[var(--chayong-divider)]" />
    </div>
  );
}
