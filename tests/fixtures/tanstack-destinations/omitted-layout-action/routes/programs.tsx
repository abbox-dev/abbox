import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/programs")({
  component: ProgramsLayout,
});

function layoutAction() {}

function ProgramsLayout() {
  return (
    <button type="button" onClick={layoutAction}>
      Layout action
    </button>
  );
}
