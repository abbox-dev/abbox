import { createFileRoute } from "@tanstack/react-router";
import { DeleteButton } from "../components/DeleteButton";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <DeleteButton />;
}
