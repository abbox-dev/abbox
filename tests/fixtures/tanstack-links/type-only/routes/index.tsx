import type { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

type _KeepTypeOnlyLinkImport = Link;

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return null;
}
