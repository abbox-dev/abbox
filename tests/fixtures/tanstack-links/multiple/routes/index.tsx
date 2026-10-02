import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/settings">Settings</Link>
      <Link to="/settings">Settings again</Link>
      <Link to="/">Home</Link>
    </>
  );
}
