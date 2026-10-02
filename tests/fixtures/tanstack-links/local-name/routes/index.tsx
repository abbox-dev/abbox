import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Link(_props: { to: string; children?: unknown }) {
  return null;
}

function Home() {
  return <Link to="/projects">Projects</Link>;
}
