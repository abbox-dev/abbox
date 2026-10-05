import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [name, setName] = useState("Ada");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) {
          setName("");
        }
      }}
    >
      <button type="submit">Send</button>
    </form>
  );
}
