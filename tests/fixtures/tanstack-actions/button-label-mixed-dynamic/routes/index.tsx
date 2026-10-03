import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function act() {}

function Row() {
  return null;
}

function Glyph() {
  return null;
}

const fieldName = "type";
const values: Record<string, string> = {};

function Home() {
  return (
    <button type="button" onClick={act}>
      <Row>
        {fieldName}: {values[fieldName]} <Glyph />
      </Row>
    </button>
  );
}
