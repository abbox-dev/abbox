import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function save() {}

function Home() {
  return (
    <button type="button" onClick={save}>
      Save
    </button>
  );
}
