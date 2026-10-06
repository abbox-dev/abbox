import { createFileRoute } from "@tanstack/react-router";
import { SharedCard } from "../components/SharedCard";

export const Route = createFileRoute("/alpha")({
  component: Alpha,
});

function Alpha() {
  return <SharedCard />;
}
