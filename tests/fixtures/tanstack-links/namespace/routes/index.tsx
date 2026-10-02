import * as Router from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <Router.Link to="/projects">Projects</Router.Link>;
}
