import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  return (
    <button type="button" disabled={open} onClick={() => setOpen(true)}>
      Open
    </button>
  );
}
