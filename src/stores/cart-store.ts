"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  bookingId: string | null;
  setBookingId: (id: string | null) => void;
  paymentKey: string | null;
  setPaymentKey: (key: string | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      bookingId: null,
      paymentKey: null,
      setItems: (items) => set({ items }),
      setBookingId: (bookingId) => set({ bookingId }),
      setPaymentKey: (paymentKey) => set({ paymentKey }),
      clear: () => set({ items: [], bookingId: null, paymentKey: null }),
    }),
    { name: "eh_cart" },
  ),
);
