import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const dest = "/target";
  return <Link to={dest}>Go</Link>;
}
