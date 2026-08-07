import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Home } from "lucide-react";
import { ReactNode } from "react";

export function StageHeader({
  eyebrow,
  title,
  subtitle,
  backTo,
  right,
  showHome = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backTo?: string;
  right?: ReactNode;
  showHome?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-navy px-5 pb-5 pt-6 text-navy-foreground md:rounded-t-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {backTo !== undefined && (
            <button
              type="button"
              aria-label="Back"
              onClick={() => (backTo ? router.navigate({ to: backTo as never }) : router.history.back())}
              className="-ml-2 mt-0.5 rounded-full p-1.5 text-navy-foreground/80 hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1 font-display text-2xl leading-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-white/75">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {showHome && (
            <Link
              to="/"
              aria-label="Home"
              className="rounded-full p-1.5 text-navy-foreground/80 hover:bg-white/10"
            >
              <Home className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function HomeLink({ label }: { label: string }) {
  return (
    <Link to="/" className="text-xs text-white/70 underline-offset-2 hover:underline">
      {label}
    </Link>
  );
}
