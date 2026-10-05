import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/programs")({
  component: ProgramsLayout,
});

function filter() {}

function ProgramsLayout() {
  return (
    <button type="button" onClick={filter}>
      Filter
    </button>
  );
}
