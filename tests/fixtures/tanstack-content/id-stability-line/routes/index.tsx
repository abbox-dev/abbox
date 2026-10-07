import { createFileRoute } from "@tanstack/react-router";

// unrelated comment block added above jsx

export const Route = createFileRoute("/")({
  component: Page,
});

function Page() {
  return (
    <div>
      <h1>Version A</h1>
    </div>
  );
}
