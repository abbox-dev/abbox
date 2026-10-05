import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const nav = useNavigate();
  return (
    <button
      type="button"
      onClick={() => nav({ to: ".", search: { view: "cards" } })}
    >
      Cards
    </button>
  );
}
