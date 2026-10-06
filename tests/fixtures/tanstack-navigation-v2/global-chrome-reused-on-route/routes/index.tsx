import { createFileRoute } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createFileRoute("/")({ component: Home });
function Home() { return <Chrome><div>local</div></Chrome>; }
