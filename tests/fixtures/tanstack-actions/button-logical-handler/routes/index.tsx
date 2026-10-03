import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function save() {}

const enabled = true;

function Home() {
  return (
    <button type="button" onClick={enabled && save}>
      Save
    </button>
  );
}
