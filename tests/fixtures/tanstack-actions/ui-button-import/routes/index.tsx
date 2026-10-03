import { createFileRoute } from "@tanstack/react-router";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function save() {}

function Home() {
  return <Button onClick={save}>Save</Button>;
}
