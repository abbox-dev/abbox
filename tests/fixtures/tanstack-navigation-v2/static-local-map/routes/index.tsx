import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

const items = [{ path: "/a" }, { path: "/b" }];

function Home() {
  return (
    <div>
      {items.map((row) => (
        <Link key={row.path} to={row.path}>Go</Link>
      ))}
    </div>
  );
}
