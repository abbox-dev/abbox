import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/programs/$programId")({
  component: ProgramDetail,
});

function ProgramDetail() {
  return null;
}
