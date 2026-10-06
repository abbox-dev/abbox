import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Chrome({ children }: { children: ReactNode }) {
  return (
    <div>
      <button type="button" onClick={() => {}}>
        Chrome action
      </button>
      <Link to="/">Home</Link>
      {children}
    </div>
  );
}
