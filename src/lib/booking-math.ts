export interface TicketLineInput {
  quantity: number;
  unitPrice: number;
  availableQuantity: number;
}

export function lineTotal(quantity: number, unitPrice: number) {
  if (quantity < 0 || unitPrice < 0) {
    throw new Error("Quantity and price must be non-negative");
  }
  return Number((quantity * unitPrice).toFixed(2));
}

export function bookingTotal(items: { quantity: number; unitPrice: number }[]) {
  return items.reduce((sum, item) => sum + lineTotal(item.quantity, item.unitPrice), 0);
}

export function assertTicketAvailability(items: TicketLineInput[]) {
  for (const item of items) {
    if (item.quantity < 1) {
      throw new Error("Each ticket line must have at least 1 ticket");
    }
    if (item.quantity > item.availableQuantity) {
      throw new Error("Requested quantity exceeds remaining tickets");
    }
  }
  return true;
}

export function remainingAfterHold(available: number, requested: number) {
  if (requested > available) {
    throw new Error("Overbooked");
  }
  return available - requested;
}

/** Last-N inventory: first 20 of 500 concurrent buyers succeed. */
export function allocateScarceInventory(available: number, requests: number[]) {
  let remaining = available;
  return requests.map((qty) => {
    if (qty <= remaining) {
      remaining -= qty;
      return { allocated: qty, remaining };
    }
    const allocated = remaining;
    remaining = 0;
    return { allocated, remaining };
  });
}
