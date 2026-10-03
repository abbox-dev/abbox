import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function act() {}

const label = "Name";

function Home() {
  return (
    <button type="button" onClick={act}>
      {label}: value
    </button>
  );
}
