import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Chrome({ children }: { children: ReactNode }) {
  return (
    <div>
      <Link to="/">Home</Link>
      {children}
    </div>
  );
}
