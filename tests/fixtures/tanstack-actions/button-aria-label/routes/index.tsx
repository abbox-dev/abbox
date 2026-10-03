import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function save() {}

function Home() {
  return (
    <button type="button" aria-label="Save" onClick={save}>
      <span />
    </button>
  );
}
