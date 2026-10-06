import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function ShellB({ children }: { children: ReactNode }) {
  return (<div><Link to="/b">B</Link>{children}</div>);
}
