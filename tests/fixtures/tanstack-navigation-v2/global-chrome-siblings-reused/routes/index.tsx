import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "../components/TopBar";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <TopBar />;
}
