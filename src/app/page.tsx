export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-8">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight text-text-primary">
          Nuzlocke Route Planner
        </h1>
        <p className="max-w-md text-lg text-text-body">
          Plan your encounters. Analyze type coverage. Survive the run.
        </p>
        <div className="mt-4 font-mono text-sm text-text-muted">v0.1.0 — Field Journal Edition</div>
      </main>
    </div>
  );
}
