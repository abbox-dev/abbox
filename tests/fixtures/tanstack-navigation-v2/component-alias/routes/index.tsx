import { createFileRoute } from "@tanstack/react-router";
import { ItemCard as Row } from "../components/ItemCard";
export const Route = createFileRoute("/")({ component: Home });
function Home() { return <Row />; }
