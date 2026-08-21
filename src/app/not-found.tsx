export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold">404</h1>
        <p className="mt-4 text-text-secondary">This page doesn&apos;t exist.</p>
        <a href="/" className="mt-8 inline-block text-sm font-medium uppercase tracking-[0.1em] text-text-secondary hover:text-text">
          ← Back to homepage
        </a>
      </div>
    </div>
  );
}
