import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/programs")({
  component: ProgramsLayout,
});

function ProgramsLayout() {
  return null;
}
