import { createFileRoute } from "@tanstack/react-router";
import { ItemCard } from "../components/ItemCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <ItemCard />;
}
