import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects")({
  component: Projects,
});

function Projects() {
  return null;
}
