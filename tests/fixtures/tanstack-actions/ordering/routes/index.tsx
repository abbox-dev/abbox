import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function handleSubmit() {}

function zebra() {}

function alpha() {}

function Home() {
  return (
    <>
      <form onSubmit={handleSubmit}>
        <button type="submit">Go</button>
      </form>
      <button type="button" onClick={zebra}>
        Zebra
      </button>
      <button type="button" onClick={alpha}>
        Alpha
      </button>
    </>
  );
}
