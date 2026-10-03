import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function handleSubmit() {}

function onSaveClick() {}

function Home() {
  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" onClick={onSaveClick}>
        Save
      </button>
    </form>
  );
}
