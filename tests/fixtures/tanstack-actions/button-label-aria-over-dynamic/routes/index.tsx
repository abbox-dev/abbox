import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function act() {}

const label = "Dynamic";

function Home() {
  return (
    <button type="button" aria-label="Save" onClick={act}>
      {label}
    </button>
  );
}
