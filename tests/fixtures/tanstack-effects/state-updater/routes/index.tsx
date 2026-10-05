import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [count, setCount] = useState(0);
  return (
    <button
      type="button"
      disabled={count === 0}
      onClick={() => setCount((value) => value + 1)}
    >
      Increment
    </button>
  );
}
