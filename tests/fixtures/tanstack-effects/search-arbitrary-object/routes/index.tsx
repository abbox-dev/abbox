import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

const Something = {
  useNavigate() {
    return (_options: { to?: string; search?: object }) => undefined;
  },
};

function Home() {
  const nav = Something.useNavigate();
  return (
    <button type="button" onClick={() => nav({ to: ".", search: { q: "" } })}>
      Search
    </button>
  );
}
