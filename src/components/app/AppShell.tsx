import { ReactNode, useRef, forwardRef } from "react";

export const AppShell = forwardRef<
  HTMLElement,
  {
    header?: ReactNode;
    children: ReactNode;
    bottom?: ReactNode;
  }
>(({ header, children, bottom }, ref) => {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-background shadow-xl shadow-black/5 md:my-6 md:h-[calc(100dvh-3rem)] md:rounded-3xl md:overflow-hidden">
      {header}
      <main ref={ref} className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain pb-0">
        {children}
      </main>
      {bottom}
    </div>
  );
});
