import { Link } from "@tanstack/react-router";
export function Card() {
  return (
    <button asChild>
      <Link to="/target">Go</Link>
    </button>
  );
}
