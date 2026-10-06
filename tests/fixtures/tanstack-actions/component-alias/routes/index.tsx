import { createFileRoute } from "@tanstack/react-router";
import { ItemCard as AliasCard } from "../components/ItemCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <AliasCard />;
}
