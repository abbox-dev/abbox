import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: Auth,
});

function Auth() {
  return null;
}
