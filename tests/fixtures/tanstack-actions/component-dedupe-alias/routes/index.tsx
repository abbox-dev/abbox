import { createFileRoute } from "@tanstack/react-router";
import { Card as CardA, Card as CardB } from "../components/Card";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <CardA />
      <CardB />
    </>
  );
}
