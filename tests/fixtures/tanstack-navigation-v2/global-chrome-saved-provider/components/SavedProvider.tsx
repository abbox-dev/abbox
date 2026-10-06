import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Intentionally has a link; must not become global chrome when only wrapping the real shell. */
export function SavedProvider({ children }: { children: ReactNode }) {
  return (
    <div>
      <Link to="/provider-only">Provider nav</Link>
      {children}
    </div>
  );
}
