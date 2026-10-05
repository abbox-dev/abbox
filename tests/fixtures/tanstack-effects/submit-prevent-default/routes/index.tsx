import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <button type="submit">Send</button>
    </form>
  );
}
