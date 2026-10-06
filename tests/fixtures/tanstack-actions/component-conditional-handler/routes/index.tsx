import { createFileRoute } from "@tanstack/react-router";
import { BadHandlerCard } from "../components/BadHandlerCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <BadHandlerCard />;
}
