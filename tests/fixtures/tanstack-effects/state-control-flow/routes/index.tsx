import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  const flag = true;
  return (
    <>
      <button
        type="button"
        disabled={open}
        onClick={() => {
          flag && setOpen(true);
        }}
      >
        And
      </button>
      <button
        type="button"
        onClick={() => {
          flag || setOpen(true);
        }}
      >
        Or
      </button>
      <button
        type="button"
        onClick={() => {
          flag ? setOpen(true) : setOpen(false);
        }}
      >
        Ternary
      </button>
      <button
        type="button"
        onClick={() => {
          for (const item of [flag]) {
            if (item) {
              setOpen(true);
            }
          }
        }}
      >
        For
      </button>
      <button
        type="button"
        onClick={() => {
          while (flag) {
            setOpen(true);
            break;
          }
        }}
      >
        While
      </button>
      <button
        type="button"
        onClick={() => {
          switch (flag) {
            case true:
              setOpen(true);
              break;
            default:
              break;
          }
        }}
      >
        Switch
      </button>
      <button
        type="button"
        onClick={() => {
          try {
            setOpen(true);
          } catch {
            setOpen(false);
          }
        }}
      >
        Try
      </button>
    </>
  );
}
