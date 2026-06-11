import { ReactNode } from "react";

export function AppShell({
  header,
  children,
  bottom,
}: {
  header?: ReactNode;
  children: ReactNode;
  bottom?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-xl shadow-black/5 md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-3xl md:overflow-hidden">
      {header}
      <main className="relative flex-1 overflow-hidden pb-24">{children}</main>
      {bottom}
    </div>
  );
}
