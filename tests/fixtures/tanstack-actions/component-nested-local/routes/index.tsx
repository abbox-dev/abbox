import { createFileRoute } from "@tanstack/react-router";
import { WrapperCard } from "../components/WrapperCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <WrapperCard />;
}
