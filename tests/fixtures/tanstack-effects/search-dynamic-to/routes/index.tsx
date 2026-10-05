import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const target = ".";
  return (
    <button
      type="button"
      onClick={() => nav({ to: target, search: { q: "" } })}
    >
      Search
    </button>
  );
}
