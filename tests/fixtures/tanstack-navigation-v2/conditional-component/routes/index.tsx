import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({
  component: Home,
});
function Home() {
  const show = true;
  return show ? <Card /> : null;
}
