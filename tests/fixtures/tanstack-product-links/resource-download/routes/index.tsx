import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <a href="/files/report.pdf" download>
      Download report
    </a>
  );
}
