import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({
  component: Home,
});
function Home() {
  return (
    <>
      <Link to="/target">Inline</Link>
      <Card />
    </>
  );
}
