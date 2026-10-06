#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(
  new URL(".", import.meta.url),
);

function write(rel, content) {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

const linkCard = (to, label = "Go") =>
  `import { Link } from "@tanstack/react-router";
export function Card() {
  return <Link to="${to}">${label}</Link>;
}
`;

const routeIndexWithCard = (importPath, tag) =>
  `import { createFileRoute } from "@tanstack/react-router";
import { ${tag === "default" ? "Card" : tag} } from "${importPath}";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <${tag === "default" ? "Card" : tag} />;
}
`;

write(
  "component-alias/components/ItemCard.tsx",
  `import { Link } from "@tanstack/react-router";
export function ItemCard() {
  return <Link to="/target">Go</Link>;
}
`,
);
write(
  "component-alias/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { ItemCard as Row } from "../components/ItemCard";
export const Route = createFileRoute("/")({ component: Home });
function Home() { return <Row />; }
`,
);
write("component-alias/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

write(
  "component-default/components/Card.tsx",
  `import { Link } from "@tanstack/react-router";
export default function Card() {
  return <Link to="/target">Go</Link>;
}
`,
);
write(
  "component-default/routes/index.tsx",
  routeIndexWithCard("../components/Card", "default"),
);
write("component-default/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

write(
  "multi-export-module/components/Cards.tsx",
  `import { Link } from "@tanstack/react-router";
export function CardA() { return <Link to="/a">A</Link>; }
export function CardB() { return <Link to="/b">B</Link>; }
`,
);
write(
  "multi-export-module/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { CardA } from "../components/Cards";
export const Route = createFileRoute("/")({ component: () => <CardA /> });`,
);
write("multi-export-module/routes/a.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/a")({ component: () => null });`);
write("multi-export-module/routes/b.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/b")({ component: () => null });`);

write(
  "multi-screen-usage/components/DetailLink.tsx",
  linkCard("/detail/$id"),
);
write(
  "multi-screen-usage/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/DetailLink";
export const Route = createFileRoute("/")({ component: () => <Card /> });`,
);
write(
  "multi-screen-usage/routes/other.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/DetailLink";
export const Route = createFileRoute("/other")({ component: () => <Card /> });`,
);
write(
  "multi-screen-usage/routes/detail/$id.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/detail/$id")({ component: () => null });`,
);

write(
  "conditional-component/components/Card.tsx",
  linkCard("/target"),
);
write(
  "conditional-component/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({
  component: Home,
});
function Home() {
  const show = true;
  return show ? <Card /> : null;
}
`,
);
write("conditional-component/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

write(
  "fragment-link/components/Card.tsx",
  `import { Link } from "@tanstack/react-router";
export function Card() {
  return (<><Link to="/target">Go</Link></>);
}
`,
);
write(
  "fragment-link/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({ component: () => <Card /> });`,
);
write("fragment-link/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

write(
  "button-as-child/components/Card.tsx",
  `import { Link } from "@tanstack/react-router";
export function Card() {
  return (
    <button asChild>
      <Link to="/target">Go</Link>
    </button>
  );
}
`,
);
write(
  "button-as-child/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({ component: () => <Card /> });`,
);
write("button-as-child/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

write(
  "no-recursive-child/components/Inner.tsx",
  linkCard("/inner"),
);
write(
  "no-recursive-child/components/Outer.tsx",
  `import { Inner } from "./Inner";
export function Outer() { return <Inner />; }
`,
);
write(
  "no-recursive-child/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Outer } from "../components/Outer";
export const Route = createFileRoute("/")({ component: () => <Outer /> });`,
);
write("no-recursive-child/routes/inner.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/inner")({ component: () => null });`);

write(
  "barrel-import/components/Card.tsx",
  linkCard("/target"),
);
write(
  "barrel-import/components/index.ts",
  `export { Card } from "./Card";
`,
);
write(
  "barrel-import/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components";
export const Route = createFileRoute("/")({ component: () => <Card /> });`,
);
write("barrel-import/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

write(
  "dynamic-component/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({
  component: Home,
});
function Home() {
  const Which = Card;
  return <Which />;
}
`,
);
write("dynamic-component/components/Card.tsx", linkCard("/target"));
write("dynamic-component/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

write(
  "dynamic-to/routes/index.tsx",
  `import { createFileRoute, Link } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  component: Home,
});
function Home() {
  const pick = true;
  return <Link to={pick ? "/a" : "/b"}>Go</Link>;
}
`,
);
write("dynamic-to/routes/a.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/a")({ component: () => null });`);

write(
  "unknown-destination/components/Card.tsx",
  linkCard("/missing"),
);
write(
  "unknown-destination/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({ component: () => <Card /> });`,
);

write(
  "dedupe-edges/routes/index.tsx",
  `import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "../components/Card";
export const Route = createFileRoute("/")({
  component: Home,
});
function Home() {
  return (
    <>
      <Link to="/target">Inline</Link>
      <Card />
    </>
  );
}
`,
);
write("dedupe-edges/components/Card.tsx", linkCard("/target"));
write("dedupe-edges/routes/target.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/target")({ component: () => null });`);

// global-chrome-not-found
write(
  "global-chrome-not-found/components/Chrome.tsx",
  `import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function Chrome({ children }: { children: ReactNode }) {
  return (<div><Link to="/b">B</Link>{children}</div>);
}
`,
);
write(
  "global-chrome-not-found/routes/__root.tsx",
  `import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createRootRoute()({
  component: Root,
  notFoundComponent: NotFound,
});
function Root() { return <Chrome><Outlet /></Chrome>; }
function NotFound() { return <Link to="/">Home</Link>; }
`,
);
write("global-chrome-not-found/routes/index.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: () => null });`);
write("global-chrome-not-found/routes/b.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/b")({ component: () => null });`);

write(
  "global-chrome-error/routes/__root.tsx",
  `import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createRootRoute()({
  component: Root,
  errorComponent: ErrorView,
});
function Root() { return <Chrome><Outlet /></Chrome>; }
function ErrorView() { return <a href="/">Home</a>; }
`,
);
write(
  "global-chrome-error/components/Chrome.tsx",
  `import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function Chrome({ children }: { children: ReactNode }) {
  return (<div><Link to="/b">B</Link>{children}</div>);
}
`,
);
write("global-chrome-error/routes/index.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: () => null });`);
write("global-chrome-error/routes/b.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/b")({ component: () => null });`);

write(
  "global-chrome-provider/routes/__root.tsx",
  `import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Provider } from "../components/Provider";
import { Chrome } from "../components/Chrome";
export const Route = createRootRoute()({ component: Root });
function Root() {
  return (
    <Provider>
      <Chrome><Outlet /></Chrome>
    </Provider>
  );
}
`,
);
write(
  "global-chrome-provider/components/Provider.tsx",
  `import type { ReactNode } from "react";
export function Provider({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
`,
);
write(
  "global-chrome-provider/components/Chrome.tsx",
  `import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function Chrome({ children }: { children: ReactNode }) {
  return (<div><Link to="/b">B</Link>{children}</div>);
}
`,
);
write("global-chrome-provider/routes/index.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: () => null });`);
write("global-chrome-provider/routes/b.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/b")({ component: () => null });`);

write(
  "global-chrome-ambiguous/routes/__root.tsx",
  `import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ShellA } from "../components/ShellA";
import { ShellB } from "../components/ShellB";
export const Route = createRootRoute()({ component: Root });
function Root() {
  return (
    <>
      <ShellA><Outlet /></ShellA>
      <ShellB><Outlet /></ShellB>
    </>
  );
}
`,
);
write(
  "global-chrome-ambiguous/components/ShellA.tsx",
  `import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function ShellA({ children }: { children: ReactNode }) {
  return (<div><Link to="/a">A</Link>{children}</div>);
}
`,
);
write(
  "global-chrome-ambiguous/components/ShellB.tsx",
  `import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function ShellB({ children }: { children: ReactNode }) {
  return (<div><Link to="/b">B</Link>{children}</div>);
}
`,
);
write("global-chrome-ambiguous/routes/index.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: () => null });`);

write(
  "global-chrome-reused-on-route/routes/__root.tsx",
  `import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createRootRoute()({ component: Root });
function Root() { return <Chrome><Outlet /></Chrome>; }
`,
);
write(
  "global-chrome-reused-on-route/components/Chrome.tsx",
  `import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
export function Chrome({ children }: { children: ReactNode }) {
  return (<div><Link to="/b">B</Link>{children}</div>);
}
`,
);
write(
  "global-chrome-reused-on-route/routes/index.tsx",
  `import { createFileRoute } from "@tanstack/react-router";
import { Chrome } from "../components/Chrome";
export const Route = createFileRoute("/")({ component: Home });
function Home() { return <Chrome><div>local</div></Chrome>; }
`,
);
write("global-chrome-reused-on-route/routes/b.tsx", `import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/b")({ component: () => null });`);

console.log("fixtures written");
