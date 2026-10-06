import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ShellA } from "../components/ShellA";
import { ShellB } from "../components/ShellB";
export const Route = createRootRoute()({ component: Root });
function Root() {
  return (
    <>
      <ShellA><Outlet /></ShellA>
      <ShellB><Outlet /></ShellB>
    </>
  );
}
