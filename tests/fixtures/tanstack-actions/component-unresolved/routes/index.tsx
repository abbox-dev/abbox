import { createFileRoute } from "@tanstack/react-router";
import { MissingCard } from "../components/does-not-exist";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <MissingCard />;
}
