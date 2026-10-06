import { createFileRoute } from "@tanstack/react-router";
import { EffectCard } from "../components/EffectCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <EffectCard />;
}
