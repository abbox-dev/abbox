import { createFileRoute } from "@tanstack/react-router";

const TITLE = "Const title";

export const Route = createFileRoute("/")({
  component: Page,
});

function Page() {
  return (
    <div>
      <h1>Hello World</h1>
      <p>Paragraph copy</p>
      <span>Span text</span>
      <div>Div text</div>
      <button type="button" onClick={() => {}}>
        Save
      </button>
      <a href="/cv.pdf">Download CV</a>
      <img alt="Landing preview." src="/hero.png" />
      <input placeholder="Search investors..." />
      <h2>{saved ? "Saved" : "Save"}</h2>
      <p>{user.name}</p>
      <div className="text-muted">Visible in div</div>
      <p>
        {"Hello "}
        {"World"}
      </p>
      <p>{`Static template`}</p>
      <p>{TITLE}</p>
      <p>
        Mixed <strong>nested</strong> static
      </p>
      <p>Repeat</p>
      <p>Repeat</p>
    </div>
  );
}

const saved = false;
const user = { name: "Ada" };
