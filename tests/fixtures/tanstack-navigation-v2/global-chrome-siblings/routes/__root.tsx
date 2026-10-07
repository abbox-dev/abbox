import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TopBar } from "../components/TopBar";
import { BottomBar } from "../components/BottomBar";

export const Route = createRootRoute()({ component: Root });

function Root() {
  return (
    <div>
      <TopBar />
      <main>
        <Outlet />
      </main>
      <BottomBar />
    </div>
  );
}
