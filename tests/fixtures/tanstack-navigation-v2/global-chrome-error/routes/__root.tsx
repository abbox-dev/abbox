import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createRootRoute()({
  component: Root,
  errorComponent: ErrorView,
});
function Root() { return <Chrome><Outlet /></Chrome>; }
function ErrorView() { return <a href="/">Home</a>; }
