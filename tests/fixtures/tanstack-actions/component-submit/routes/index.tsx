import { createFileRoute } from "@tanstack/react-router";
import { SubmitCard } from "../components/SubmitCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <SubmitCard />;
}
