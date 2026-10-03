import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function act() {}

function Text({ children }: { children: string }) {
  return <span>{children}</span>;
}

function Home() {
  return (
    <button type="button" onClick={act}>
      <Text>Save</Text>
    </button>
  );
}
