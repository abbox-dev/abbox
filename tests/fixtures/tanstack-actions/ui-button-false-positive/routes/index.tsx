import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function save() {}

function Button({
  onClick: _onClick,
  children,
}: {
  onClick: () => void;
  children: string;
}) {
  return <>{children}</>;
}

function Home() {
  return <Button onClick={save}>Save</Button>;
}
