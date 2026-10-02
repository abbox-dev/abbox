import { createFileRoute, Link } from "@tanstack/react-router";

const destination = "/projects";
const segment = "projects";
const pickDashboard = false;

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <Link to="/projects">Projects</Link>
      <Link to={destination}>Variable</Link>
      <Link to={pickDashboard ? "/dashboard" : "/projects"}>Conditional</Link>
      <Link to={`/${segment}`}>Template</Link>
      <Link to="..">Parent</Link>
      <Link to="../settings">Relative</Link>
      <Link to="settings">Bare</Link>
      <Link to="//example.com">Protocol</Link>
      <Link to="/projects">Parenthesized</Link>
      <a href="/projects">Anchor</a>
      <button type="button" onClick={() => navigate({ to: "/projects" })}>
        Navigate
      </button>
      <button type="button" onClick={() => redirect({ to: "/projects" })}>
        Redirect
      </button>
    </>
  );
}

function navigate(_options: { to: string }) {}

function redirect(_options: { to: string }) {}
