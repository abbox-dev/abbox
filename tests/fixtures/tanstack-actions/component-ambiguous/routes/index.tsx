import { createFileRoute } from "@tanstack/react-router";
import { DeleteButton } from "../components/DeleteButton";

export const HomeRoute = createFileRoute("/")({
  component: Home,
});

export const AboutRoute = createFileRoute("/about")({
  component: About,
});

function Home() {
  return <DeleteButton />;
}

function About() {
  return null;
}
