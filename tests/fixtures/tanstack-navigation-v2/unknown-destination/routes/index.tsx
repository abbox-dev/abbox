import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({ component: () => <Card /> });