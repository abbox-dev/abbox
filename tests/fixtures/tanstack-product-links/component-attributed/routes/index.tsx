import { createFileRoute } from "@tanstack/react-router";
import { HelpLinks } from "../components/HelpLinks";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <HelpLinks />;
}
