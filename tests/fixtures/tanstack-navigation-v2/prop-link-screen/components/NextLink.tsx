import { Link } from "@tanstack/react-router";

export function NextLink({ nextHref }: { nextHref: string }) {
  return <Link to={nextHref}>Next</Link>;
}
