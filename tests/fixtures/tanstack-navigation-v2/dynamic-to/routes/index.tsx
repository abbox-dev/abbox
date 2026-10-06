import { createFileRoute, Link } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  component: Home,
});
function Home() {
  const pick = true;
  return <Link to={pick ? "/a" : "/b"}>Go</Link>;
}
