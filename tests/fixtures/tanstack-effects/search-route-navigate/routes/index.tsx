import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const nav = Route.useNavigate();
  return (
    <button type="button" onClick={() => nav({ search: { q: "" } })}>
      Search
    </button>
  );
}
