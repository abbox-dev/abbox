import { createFileRoute } from "@tanstack/react-router";

export const HomeRoute = createFileRoute("/")({
  component: Home,
});

export const AboutRoute = createFileRoute("/about")({
  component: About,
});

function save() {}

function Home() {
  return (
    <button type="button" onClick={save}>
      Save
    </button>
  );
}

function About() {
  return null;
}
