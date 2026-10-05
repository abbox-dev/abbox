import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  function write() {
    setOpen(true);
  }
  function clear() {
    write();
  }
  return (
    <button type="button" disabled={open} onClick={clear}>
      Clear
    </button>
  );
}
