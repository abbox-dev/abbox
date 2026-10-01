import { createFileRoute as fileRoute } from "@tanstack/react-router";

export const Route = fileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  return null;
}
