import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/visible")({
  component: Visible,
});

function Visible() {
  return null;
}
