import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function save() {}

const label = "Save";

function Home() {
  return (
    <button type="button" onClick={save}>
      {label}
    </button>
  );
}
