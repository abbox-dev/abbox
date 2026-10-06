import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function ShellA({ children }: { children: ReactNode }) {
  return (<div><Link to="/a">A</Link>{children}</div>);
}
