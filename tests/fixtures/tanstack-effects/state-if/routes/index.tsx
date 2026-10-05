import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  const flag = true;
  return (
    <button
      disabled={open}
      type="button"
      onClick={() => {
        if (flag) {
          setOpen(true);
        }
      }}
    >
      Open
    </button>
  );
}
