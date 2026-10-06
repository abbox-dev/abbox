import { createFileRoute } from "@tanstack/react-router";
import { ItemCard } from "../components/ItemCard";

export const Route = createFileRoute("/items")({
  component: Items,
});

function Items() {
  return <ItemCard />;
}
