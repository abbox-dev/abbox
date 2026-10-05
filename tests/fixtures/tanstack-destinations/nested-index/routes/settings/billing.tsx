import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/billing")({
  component: Billing,
});

function Billing() {
  return null;
}
