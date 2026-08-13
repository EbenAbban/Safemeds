export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
      <div className="text-center" role="status" aria-live="polite">
        <div className="animate-spin motion-reduce:animate-none rounded-full h-12 w-12 border-b-2 border-soft-aqua mx-auto" />
        <p className="mt-4 text-on-surface-variant">Loading…</p>
      </div>
    </div>
  );
}
