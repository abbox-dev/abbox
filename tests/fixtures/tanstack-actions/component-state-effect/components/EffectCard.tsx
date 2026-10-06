import { useState } from "react";

export function EffectCard() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" disabled={count === -1} onClick={() => setCount(1)}>
      Bump
    </button>
  );
}
