import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
import { SavedProvider } from "../components/SavedProvider";

export const Route = createRootRoute()({ component: Root });

function Root() {
  return (
    <SavedProvider>
      <Chrome>
        <Outlet />
      </Chrome>
    </SavedProvider>
  );
}
