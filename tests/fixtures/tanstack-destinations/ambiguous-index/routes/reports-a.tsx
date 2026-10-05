import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reports/")({
  component: ReportsA,
});

function ReportsA() {
  return null;
}
