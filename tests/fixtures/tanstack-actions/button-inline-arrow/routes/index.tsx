import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <button type="button" onClick={() => undefined}>
      Add investor
    </button>
  );
}
