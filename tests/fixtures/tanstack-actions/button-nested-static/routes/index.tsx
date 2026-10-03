import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function save() {}

function SaveIcon() {
  return null;
}

function Home() {
  return (
    <button type="button" onClick={save}>
      <SaveIcon />
      Save
    </button>
  );
}
