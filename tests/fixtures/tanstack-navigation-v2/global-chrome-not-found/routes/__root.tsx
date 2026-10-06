import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createRootRoute()({
  component: Root,
  notFoundComponent: NotFound,
});
function Root() { return <Chrome><Outlet /></Chrome>; }
function NotFound() { return <Link to="/">Home</Link>; }
