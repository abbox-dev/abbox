import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function homeAction() {}

function Home() {
  return (
    <button type="button" onClick={homeAction}>
      Home
    </button>
  );
}
