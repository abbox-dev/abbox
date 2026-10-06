import { createFileRoute } from "@tanstack/react-router";
import { ActionLinkCard } from "../components/ActionLinkCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <ActionLinkCard />;
}
