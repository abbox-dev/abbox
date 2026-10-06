import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components";
export const Route = createFileRoute("/")({ component: () => <Card /> });