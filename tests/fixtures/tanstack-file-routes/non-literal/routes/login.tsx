import { createFileRoute } from "@tanstack/react-router";

const path = "/dashboard";

export const LoginRoute = createFileRoute("/login")({
  component: Login,
});

export const DynamicRoute = createFileRoute(path)({
  component: Dynamic,
});

export const TemplateRoute = createFileRoute(`/settings`)({
  component: Settings,
});

function Login() {
  return null;
}

function Dynamic() {
  return null;
}

function Settings() {
  return null;
}
