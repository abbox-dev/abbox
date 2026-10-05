import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reports/")({
  component: ReportsB,
});

function ReportsB() {
  return null;
}
