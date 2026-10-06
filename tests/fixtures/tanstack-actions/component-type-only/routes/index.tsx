import { createFileRoute } from "@tanstack/react-router";
import type { ItemCard } from "../components/ItemCard";
import { ItemCard as RealCard } from "../components/ItemCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const _unused: typeof ItemCard | undefined = undefined;
  void _unused;
  return <RealCard />;
}
