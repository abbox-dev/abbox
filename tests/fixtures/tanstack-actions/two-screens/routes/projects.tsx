import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  component: Projects,
});

function projectsAction() {}

function Projects() {
  return (
    <button type="button" onClick={projectsAction}>
      Projects
    </button>
  );
}
