import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(true);
  function clear() {
    setOpen(false);
  }
  return (
    <button type="button" disabled={open} onClick={clear}>
      Clear
    </button>
  );
}
