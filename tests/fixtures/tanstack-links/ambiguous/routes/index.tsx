import { createFileRoute, Link } from "@tanstack/react-router";

export const HomeRoute = createFileRoute("/")({
  component: Home,
});

export const AboutRoute = createFileRoute("/about")({
  component: About,
});

function Home() {
  return <Link to="/about">About</Link>;
}

function About() {
  return null;
}
