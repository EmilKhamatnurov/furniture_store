"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "./types";

// ---------------------------------------------------------------------------
// localStorage serialization
// JSON.stringify cannot handle bigint — we round-trip kopecks as strings.
// ---------------------------------------------------------------------------
function serializeCart(items: CartItem[]): string {
  return JSON.stringify(
    items.map((item) => ({ ...item, priceCopecks: item.priceCopecks.toString() }))
  );
}

function deserializeCart(json: string): CartItem[] {
  try {
    const raw = JSON.parse(json) as Array<
      Omit<CartItem, "priceCopecks"> & { priceCopecks: string }
    >;
    return raw.map((item) => ({ ...item, priceCopecks: BigInt(item.priceCopecks) }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
type Action =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; variantId: string }
  | { type: "SET_QTY"; variantId: string; qty: number }
  | { type: "CLEAR" };

function cartReducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "HYDRATE":
      return action.items;

    case "ADD": {
      const idx = state.findIndex((i) => i.variantId === action.item.variantId);
      if (idx >= 0) {
        // Already in cart — increment quantity
        return state.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }

    case "REMOVE":
      return state.filter((i) => i.variantId !== action.variantId);

    case "SET_QTY":
      if (action.qty <= 0) return state.filter((i) => i.variantId !== action.variantId);
      return state.map((i) =>
        i.variantId === action.variantId ? { ...i, quantity: action.qty } : i
      );

    case "CLEAR":
      return [];

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalCopecks: bigint;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "furniture_cart_v1";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);
  // Prevent writing to localStorage during SSR / before hydration
  const [hydrated, setHydrated] = useState(false);

  // Read cart from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) dispatch({ type: "HYDRATE", items: deserializeCart(stored) });
    setHydrated(true);
  }, []);

  // Persist cart to localStorage whenever items change (skip pre-hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, serializeCart(items));
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD", item });
    setIsOpen(true); // open drawer on add
  }, []);

  const removeItem = useCallback((variantId: string) => {
    dispatch({ type: "REMOVE", variantId });
  }, []);

  const setQuantity = useCallback((variantId: string, qty: number) => {
    dispatch({ type: "SET_QTY", variantId, qty });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalCopecks = items.reduce(
    (sum, i) => sum + i.priceCopecks * BigInt(i.quantity),
    0n
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalCopecks,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        setQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
