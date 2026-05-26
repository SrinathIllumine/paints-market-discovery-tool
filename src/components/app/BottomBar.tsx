import { ReactNode } from "react";

export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-card/95 px-5 py-3 backdrop-blur md:rounded-b-3xl">
      {children}
    </div>
  );
}
