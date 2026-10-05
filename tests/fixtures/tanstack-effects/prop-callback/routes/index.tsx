import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Panel({ close }: { close: () => void }) {
  return (
    <button type="button" onClick={close}>
      Close
    </button>
  );
}

function Home() {
  const [open, setOpen] = useState(true);
  return <Panel close={() => setOpen(!open)} />;
}
