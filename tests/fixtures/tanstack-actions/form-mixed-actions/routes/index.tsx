import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function handleSubmit() {}

function addItem() {}

function removeRow() {}

function Home() {
  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Create</button>
      <button type="button" onClick={addItem}>
        Add item
      </button>
      <button type="button" onClick={removeRow}>
        Remove row
      </button>
    </form>
  );
}
