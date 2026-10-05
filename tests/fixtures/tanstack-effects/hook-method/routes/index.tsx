import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function useSomething() {
  const [, setSaved] = useState(false);
  return {
    save() {
      setSaved(true);
    },
  };
}

function Home() {
  const { save } = useSomething();
  return (
    <button type="button" onClick={save}>
      Save
    </button>
  );
}
