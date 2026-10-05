import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/programs/")({
  component: ProgramsPage,
});

function ProgramsPage() {
  return null;
}
