import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div>
      <Card slug="/detail" />
    </div>
  );
}

function Card({ slug }: { slug: string }) {
  return <Link to={slug}>Open</Link>;
}
