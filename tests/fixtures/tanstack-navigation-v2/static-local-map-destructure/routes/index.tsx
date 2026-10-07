import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

const items = [{ slug: "/x" }, { slug: "/y" }];

function Home() {
  return (
    <div>
      {items.map(({ slug }) => (
        <Link key={slug} to={slug}>Go</Link>
      ))}
    </div>
  );
}
