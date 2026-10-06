import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/DetailLink";
export const Route = createFileRoute("/")({ component: () => <Card /> });