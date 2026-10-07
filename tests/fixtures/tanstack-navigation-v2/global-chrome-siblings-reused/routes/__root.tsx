import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TopBar } from "../components/TopBar";

export const Route = createRootRoute()({ component: Root });

function Root() {
  return (
    <div>
      <TopBar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
