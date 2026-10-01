import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/built")({
  component: Built,
});

function Built() {
  return null;
}
