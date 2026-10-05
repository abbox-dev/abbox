import { createFileRoute } from "@tanstack/react-router";
import { save } from "../helper";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <button type="button" onClick={save}>
      Save
    </button>
  );
}
