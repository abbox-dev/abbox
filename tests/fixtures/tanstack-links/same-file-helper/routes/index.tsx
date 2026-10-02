import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <NavLink />;
}

function NavLink() {
  return <Link to="/projects">Projects</Link>;
}
