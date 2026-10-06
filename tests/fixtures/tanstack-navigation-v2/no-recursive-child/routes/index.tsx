import { createFileRoute } from "@tanstack/react-router";
import { Outer } from "../components/Outer";
export const Route = createFileRoute("/")({ component: () => <Outer /> });