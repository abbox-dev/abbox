import { createFileRoute } from "@tanstack/react-router";
import { LinkNav } from "../components/Nav";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <LinkNav />;
}
