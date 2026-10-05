import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <button
      disabled={open}
      type="button"
      onClick={() => {
        setOpen(true);
        nav({ to: ".", search: { q: "" } });
      }}
    >
      Apply
    </button>
  );
}
