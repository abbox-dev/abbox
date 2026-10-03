import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function first() {}

function second() {}

function Home() {
  return (
    <>
      <button type="button" onClick={first}>
        First
      </button>
      <button type="button" onClick={second}>
        Second
      </button>
    </>
  );
}
