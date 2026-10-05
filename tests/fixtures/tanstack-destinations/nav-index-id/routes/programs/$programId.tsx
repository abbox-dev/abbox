import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/programs/$programId")({
  component: ProgramDetail,
});

function ProgramDetail() {
  return <Link to="/programs/">Back</Link>;
}
