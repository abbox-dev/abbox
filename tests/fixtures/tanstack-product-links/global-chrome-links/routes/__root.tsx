import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createRootRoute()({ component: Root });

function Root() {
  return (
    <div>
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
