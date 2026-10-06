import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createRootRoute()({ component: Root });
function Root() { return <Chrome><Outlet /></Chrome>; }
