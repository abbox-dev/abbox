import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate({ to: "/settings" })}>
      Settings
    </button>
  );
}
