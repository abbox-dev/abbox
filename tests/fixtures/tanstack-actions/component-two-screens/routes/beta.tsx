import { createFileRoute } from "@tanstack/react-router";
import { SharedCard } from "../components/SharedCard";

export const Route = createFileRoute("/beta")({
  component: Beta,
});

function Beta() {
  return <SharedCard />;
}
