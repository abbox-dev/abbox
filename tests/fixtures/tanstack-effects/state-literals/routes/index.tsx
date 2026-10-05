import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [name, setName] = useState("");
  const [count, setCount] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={name === "" && count === 0 && note === null}
        onClick={() => setName("Ada")}
      >
        Name
      </button>
      <button type="button" onClick={() => setCount(2)}>
        Count
      </button>
      <button type="button" onClick={() => setNote(null)}>
        Note
      </button>
    </>
  );
}
