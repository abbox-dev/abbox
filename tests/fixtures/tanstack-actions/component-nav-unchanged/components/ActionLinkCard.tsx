import { Link } from "@tanstack/react-router";

export function ActionLinkCard() {
  return (
    <>
      <Link to="/target">Go</Link>
      <button type="button" onClick={() => {}}>
        Stay
      </button>
    </>
  );
}
