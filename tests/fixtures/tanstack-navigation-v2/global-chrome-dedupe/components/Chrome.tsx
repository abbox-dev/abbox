import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function Chrome({ children }: { children: ReactNode }) {
  return (
    <div>
      <Link to="/">Logo</Link><Link to="/">Home</Link>
      <Link to="/b">B</Link>
      {children}
    </div>
  );
}
