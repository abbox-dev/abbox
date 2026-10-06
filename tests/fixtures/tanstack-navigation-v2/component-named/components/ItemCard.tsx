import { Link } from "@tanstack/react-router";

export function ItemCard() {
  return (
    <Link to="/items/$itemId" params={{ itemId: "1" }}>
      Item
    </Link>
  );
}
