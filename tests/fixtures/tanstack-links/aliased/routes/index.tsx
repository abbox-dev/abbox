import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <RouterLink to="/settings">Settings</RouterLink>;
}
