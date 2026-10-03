import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function cancel() {}

function Home() {
  return (
    <form>
      <button type="button" onClick={cancel}>
        Cancel
      </button>
    </form>
  );
}
