"use client";

export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Soft spotlight behind the headline — adapts automatically to light/dark theme via tokens */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(720px circle at 18% 22%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 62%), radial-gradient(560px circle at 88% 20%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%)",
        }}
      />

      {/* Fine grid, masked to fade toward the edges */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          opacity: 0.5,
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 30%, black 25%, transparent 100%)",
        }}
      />
    </div>
  );
}
