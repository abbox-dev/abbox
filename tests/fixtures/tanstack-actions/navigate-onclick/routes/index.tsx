import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Home,
});

function navigate(_path: string) {}

function Home() {
  return <Button onClick={() => navigate("/settings")}>Settings</Button>;
}
