import { createFileRoute } from "@tanstack/react-router";
import { NextLink } from "../components/NextLink";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <NextLink nextHref="/target" />;
}
