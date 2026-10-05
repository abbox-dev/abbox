import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/other")({
  component: Other,
});

function Other() {
  return null;
}
