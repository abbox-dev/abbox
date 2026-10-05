import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [name, setName] = useState("Ada");
  return (
    <form
      onSubmit={() => {
        setName("");
      }}
    >
      <button type="submit" disabled={name.length === 0}>
        Send
      </button>
    </form>
  );
}
