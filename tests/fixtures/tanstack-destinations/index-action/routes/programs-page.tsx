import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/programs/")({
  component: ProgramsPage,
});

function save() {}

function ProgramsPage() {
  return (
    <button type="button" onClick={save}>
      Save
    </button>
  );
}
