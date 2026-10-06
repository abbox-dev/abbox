import { createFileRoute } from "@tanstack/react-router";
import { CardA } from "../components/Cards";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <CardA />;
}
