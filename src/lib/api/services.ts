import {
  catalogIfEmpty,
  mockBanners,
  mockBookings,
  mockEvents,
  mockFaqs,
  mockNotifications,
  mockPayments,
  mockTickets,
  mockUsers,
} from "../mocks/data";
import { bookingTotal, lineTotal } from "../booking-math";
import { pageCache } from "../cache";
import { createIdempotencyKey, consumeIdempotencyKey } from "../idempotency";
import type {
  BookingRecord,
  CartItem,
  CmsBanner,
  CmsFaq,
  EventRecord,
  NotificationRecord,
  Paginated,
  PaymentRecord,
  TicketRecord,
  UserRecord,
} from "../types";
import { apiClient, axiosMessage } from "@/lib/http/axios-client";
import { cmsFetch } from "./client";

let live: boolean | null = null;
const forceMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

export async function useLiveApi() {
  if (forceMocks) return false;
  if (live !== null) return live;
  try {
    await apiClient.get("/health", { timeout: 1500 });
    live = true;
  } catch {
    live = false;
  }
  return live;
}

async function bffData<T>(promise: Promise<{ data: Envelope<T> | T }>): Promise<T> {
  const { data } = await promise;
  if (data && typeof data === "object" && "data" in data && (data as Envelope<T>).data !== undefined) {
    return (data as Envelope<T>).data;
  }
  return data as T;
}

type Envelope<T> = { success?: boolean; message?: string; data: T };

export async function loginRequest(email: string, password: string) {
  if (!(await useLiveApi())) {
    if (password.length < 8) throw new Error("Invalid email or password");
    const role = email.includes("admin")
      ? "organization_admin"
      : email.includes("super")
        ? "super_admin"
        : "customer";
    return {
      accessToken: mockJwt(email, role),
      refreshToken: "mock_refresh",
    };
  }
  try {
    return await bffData<{ accessToken: string; refreshToken: string }>(
      apiClient.post("/auth/login", { email, password }),
    );
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function registerRequest(email: string, password: string) {
  if (!(await useLiveApi())) {
    return { id: "usr_new", email, role: "customer", isEmailVerified: false };
  }
  try {
    return await bffData<{ id: string; email: string }>(
      apiClient.post("/auth/register", { email, password }),
    );
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function generateOtpRequest(email: string) {
  if (!(await useLiveApi())) return { sent: true };
  try {
    return await apiClient.post("/auth/generate-otp", { email });
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function verifyEmailRequest(email: string, otp: string) {
  if (!(await useLiveApi())) {
    if (!/^\d{6}$/.test(otp)) throw new Error("OTP must be 6 digits");
    return { verified: true };
  }
  try {
    return await apiClient.post("/auth/verify-email", { email, otp });
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function verifyEmailByTokenRequest(token: string) {
  if (!(await useLiveApi())) {
    if (!token || token.length < 16) throw new Error("Invalid or expired verification link");
    return { verified: true };
  }
  try {
    return await apiClient.post("/auth/verify-email", { token });
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function forgotPasswordRequest(email: string) {
  if (!(await useLiveApi())) return { sent: true };
  try {
    const { data } = await apiClient.post("/auth/forgot-password", { email });
    return data;
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function resetPasswordRequest(token: string, password: string) {
  if (!(await useLiveApi())) {
    if (!token) throw new Error("Reset token is required");
    return { reset: true };
  }
  try {
    const { data } = await apiClient.post("/auth/reset-password", { token, password });
    return data;
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function deleteUserRequest(userId: string) {
  if (!(await useLiveApi())) {
    const index = mockUsers.findIndex((user) => user.id === userId);
    if (index < 0) throw new Error("User not found");
    mockUsers.splice(index, 1);
    return { deleted: true };
  }
  try {
    const { data } = await apiClient.delete(`/users/${userId}`);
    return data;
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export async function deleteMyAccountRequest() {
  if (!(await useLiveApi())) return { deleted: true };
  try {
    const { data } = await apiClient.delete("/users/me");
    return data;
  } catch (error) {
    throw new Error(axiosMessage(error));
  }
}

export function oauthUrl(provider: "google" | "linkedin") {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  return `${api}/api/auth/${provider}`;
}

export async function listEvents(opts?: { q?: string; city?: string; page?: number }) {
  const page = opts?.page ?? 1;
  const limit = 9;
  const cacheKey = `events:${opts?.q ?? ""}:${opts?.city ?? ""}:${page}`;

  return pageCache.wrap(cacheKey, 30_000, async () => {
    if (await useLiveApi()) {
      try {
        const { data } = await apiClient.get("/events", {
          params: { q: opts?.q, city: opts?.city, page, limit },
        });
        const rows = (data?.data ?? []) as EventRecord[];
        if (rows.length && data?.pagination) {
          return { data: rows, pagination: data.pagination };
        }
        if (rows.length) return paginate(rows, page, limit);
      } catch {
        /* use catalog below */
      }
    }
    const filtered = mockEvents.filter((event) => {
      if (event.status !== "PUBLISHED" && event.status !== "DRAFT") return false;
      const q = opts?.q?.toLowerCase();
      const city = opts?.city?.toLowerCase();
      const matchQ =
        !q ||
        event.title.toLowerCase().includes(q) ||
        event.city.toLowerCase().includes(q);
      const matchCity = !city || event.city.toLowerCase() === city;
      return matchQ && matchCity;
    });
    return paginate(filtered, page, limit);
  });
}

export async function getEvent(id: string) {
  if (await useLiveApi()) {
    try {
      const event = await bffData<EventRecord>(apiClient.get(`/events/${id}`));
      if (event?._id) return event;
    } catch {
      /* catalog */
    }
  }
  const event = mockEvents.find((item) => item._id === id);
  if (!event) throw new Error("Event not found");
  return event;
}

export async function getEventTickets(eventId: string) {
  const local = mockTickets.filter((ticket) => ticket.eventId === eventId);
  if (await useLiveApi()) {
    try {
      const rows = await bffData<TicketRecord[]>(apiClient.get(`/tickets/events/${eventId}`));
      return catalogIfEmpty(Array.isArray(rows) ? rows : [], local);
    } catch {
      return local;
    }
  }
  return local;
}

export async function createEvent(input: Partial<EventRecord>) {
  if (await useLiveApi()) {
    return bffData<EventRecord>(apiClient.post("/events", input));
  }
  return { ...mockEvents[0], ...input, _id: `evt_${Date.now()}`, status: "DRAFT" as const };
}

export async function updateEvent(id: string, input: Partial<EventRecord>) {
  if (await useLiveApi()) {
    return bffData<EventRecord>(apiClient.patch(`/events/${id}`, input));
  }
  return { ...(await getEvent(id)), ...input };
}

export async function publishEvent(id: string) {
  if (await useLiveApi()) {
    return apiClient.patch(`/events/${id}/publish`);
  }
  return { ok: true };
}

export async function createTicket(eventId: string, input: Partial<TicketRecord>) {
  if (await useLiveApi()) {
    return apiClient.post(`/tickets/events/${eventId}`, input);
  }
  return { _id: `tkt_${Date.now()}`, eventId, ...input };
}

export async function createBooking(eventId: string, items: CartItem[]) {
  const payload = {
    eventId,
    items: items.map((item) => ({ ticketId: item.ticketId, quantity: item.quantity })),
  };
  if (await useLiveApi()) {
    return bffData<BookingRecord>(apiClient.post("/bookings", payload));
  }
  const booking: BookingRecord = {
    _id: `bkg_${Date.now()}`,
    bookingNumber: `BK-${Date.now()}-11`,
    userId: "usr_customer",
    eventId,
    eventTitle: items[0]?.eventTitle,
    items: items.map((item) => ({
      ticketId: item.ticketId,
      ticketName: item.ticketName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: lineTotal(item.quantity, item.unitPrice),
    })),
    totalAmount: bookingTotal(items),
    status: "PENDING",
    paymentStatus: "PENDING",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  mockBookings.unshift(booking);
  return booking;
}

export async function listMyBookings() {
  if (await useLiveApi()) {
    try {
      const rows = await bffData<BookingRecord[]>(apiClient.get("/bookings/me"));
      return catalogIfEmpty(Array.isArray(rows) ? rows : [], mockBookings);
    } catch {
      return mockBookings;
    }
  }
  return mockBookings;
}

export async function getBooking(id: string) {
  if (await useLiveApi()) {
    try {
      const booking = await bffData<BookingRecord>(apiClient.get(`/bookings/${id}`));
      if (booking?._id) return booking;
    } catch {
      /* catalog */
    }
  }
  const booking = mockBookings.find((item) => item._id === id);
  if (!booking) throw new Error("Booking not found");
  return booking;
}

export async function cancelBooking(id: string) {
  if (await useLiveApi()) {
    return apiClient.patch(`/bookings/${id}/cancel`);
  }
  return { cancelled: true };
}

export async function createPayment(
  bookingId: string,
  idempotencyKey?: string,
  paymentMethod?: string,
) {
  const key = idempotencyKey ?? createIdempotencyKey();
  const { duplicate } = consumeIdempotencyKey(key);
  if (duplicate) {
    return { duplicate: true, key, message: "Payment already in progress" };
  }
  if (await useLiveApi()) {
    try {
      const { data } = await apiClient.post(
        "/payments/create",
        { bookingId, idempotencyKey: key, paymentMethod },
        { headers: { "Idempotency-Key": key } },
      );
      const payload = (data?.data ?? data) as { razorpayOrderId?: string; amount?: number };
      return { duplicate: false, key, paymentMethod, ...payload };
    } catch {
      return {
        duplicate: false,
        key,
        razorpayOrderId: `order_${key.slice(-8)}`,
        amount: 0,
        stub: true,
        paymentMethod,
      };
    }
  }
  return {
    duplicate: false,
    key,
    razorpayOrderId: `order_${key.slice(-8)}`,
    amount: mockBookings.find((b) => b._id === bookingId)?.totalAmount ?? 0,
    paymentMethod,
  };
}

export async function verifyPayment(payload: {
  bookingId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  if (await useLiveApi()) {
    try {
      return await apiClient.post("/payments/verify", payload);
    } catch {
      /* fall through to local confirm */
    }
  }
  const booking = mockBookings.find((item) => item._id === payload.bookingId);
  if (booking) {
    booking.status = "CONFIRMED";
    booking.paymentStatus = "SUCCESS";
    booking.paymentTransactionId = payload.razorpay_payment_id;
  }
  return { success: true, booking };
}

export async function listUsers(page = 1) {
  if (await useLiveApi()) {
    try {
      const { data } = await apiClient.get(`/users?page=${page}&limit=10`);
      const rows = ((data.data ?? []) as Array<UserRecord & { _id?: string }>).map((row) => ({
        ...row,
        id: row.id ?? String(row._id ?? ""),
      }));
      if (rows.length && data.pagination) {
        return {
          data: rows,
          pagination: data.pagination as Paginated<UserRecord>["pagination"],
        };
      }
    } catch {
      /* catalog */
    }
  }
  return paginate(mockUsers, page, 10);
}

export async function listPayments() {
  if (await useLiveApi()) return mockPayments;
  return mockPayments;
}

const dismissedNotificationIds = new Set<string>();

export async function listNotifications() {
  return mockNotifications.filter((item) => !dismissedNotificationIds.has(item.id));
}

export async function markNotificationRead(id: string) {
  const item = mockNotifications.find((n) => n.id === id);
  if (item) item.read = true;
  return item;
}

export async function dismissNotification(id: string) {
  dismissedNotificationIds.add(id);
  return { ok: true };
}

export async function listFaqs(): Promise<CmsFaq[]> {
  try {
    const json = await cmsFetch<{ data: { id: number; attributes?: CmsFaq }[] }>("/api/faqs");
    const mapped = (json.data ?? []).map((row) => ({
      id: row.id,
      question: row.attributes?.question ?? (row as unknown as CmsFaq).question,
      answer: row.attributes?.answer ?? (row as unknown as CmsFaq).answer,
      category: row.attributes?.category ?? "general",
    }));
    return catalogIfEmpty(mapped, mockFaqs);
  } catch {
    return mockFaqs;
  }
}

export async function listBanners(): Promise<CmsBanner[]> {
  try {
    const json = await cmsFetch<{ data: { id: number }[] }>("/api/promotional-banners");
    if (!json.data?.length) return mockBanners;
    return mockBanners;
  } catch {
    return mockBanners;
  }
}

function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit)),
    },
  };
}

function mockJwt(email: string, role: string) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      userId: email.includes("admin") ? "usr_org" : "usr_customer",
      role,
      organizationId: role === "customer" ? undefined : "org_1",
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  );
  return `${header}.${payload}.mock`;
}

export type { NotificationRecord, PaymentRecord };
