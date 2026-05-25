// React hook surfacing the reactive contents of a SubmissionCart.

import { useEffect, useState } from "react";
import type { SubmissionCart, CartEntry } from "./SubmissionCart";

export function useCart(cart: SubmissionCart): CartEntry[] {
  const [entries, setEntries] = useState<CartEntry[]>(() => cart.list());
  useEffect(() => {
    setEntries(cart.list());
    return cart.subscribe(() => {
      setEntries(cart.list());
    });
  }, [cart]);
  return entries;
}
