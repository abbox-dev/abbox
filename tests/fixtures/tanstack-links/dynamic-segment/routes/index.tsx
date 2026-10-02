import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Link to="/projects/$projectId" params={{ projectId: "1" }}>
      Project
    </Link>
  );
}
