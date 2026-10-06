export function BadHandlerCard() {
  const ok = true;
  return (
    <button type="button" onClick={ok ? () => {} : () => {}}>
      Bad
    </button>
  );
}
