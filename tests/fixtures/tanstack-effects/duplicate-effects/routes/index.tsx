import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  return (
    <button
      disabled={open}
      type="button"
      onClick={() => {
        setOpen(true);
        setOpen(true);
      }}
    >
      Open
    </button>
  );
}
