import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const nav = Route.useNavigate();
  const clear = () => nav({ to: ".", search: { q: "" } });
  return (
    <button type="button" onClick={clear}>
      Clear
    </button>
  );
}
