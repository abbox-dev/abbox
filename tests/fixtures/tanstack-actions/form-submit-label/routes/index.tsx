import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function handleSubmit() {}

function Home() {
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      <button type="submit">Send message</button>
    </form>
  );
}
