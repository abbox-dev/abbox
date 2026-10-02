import { createFileRoute } from "@tanstack/react-router";
import { Link } from "react-router-dom";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <Link to="/projects">Projects</Link>;
}
