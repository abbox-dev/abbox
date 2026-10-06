import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/target")({
  component: Target,
});

function Target() {
  return null;
}
