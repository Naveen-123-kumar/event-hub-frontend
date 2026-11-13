"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Form, Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, PasswordInput, Select } from "@/components/ui/input";
import { RequireAuth } from "@/components/layout/require-auth";
import { createBooking, createPayment, getBooking, verifyPayment } from "@/lib/api/services";
import { paymentSchema } from "@/lib/validation/schemas";
import { bookingTotal } from "@/lib/booking-math";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";
import { useCartStore } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";

export function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const setBookingId = useCartStore((s) => s.setBookingId);
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [loading, setLoading] = useState(false);
  const total = bookingTotal(items);

  return (
    <RequireAuth>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h1 className="font-display text-4xl">Hold these seats</h1>
          <p className="mt-2 text-sm text-ink/60">
            Creating a booking decrements inventory in a Mongo transaction. You have 15 minutes to pay.
          </p>
          <div className="mt-6 grid gap-3">
            {items.map((item) => (
              <Card key={item.ticketId} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{item.ticketName}</p>
                  <p className="text-sm text-ink/55">
                    {item.eventTitle} · ×{item.quantity}
                  </p>
                </div>
                <p>{formatCurrency(item.unitPrice * item.quantity)}</p>
              </Card>
            ))}
          </div>
        </div>
        <Card className="h-fit p-6">
          <p className="text-sm text-ink/55">Payable</p>
          <p className="font-display text-4xl">{formatCurrency(total)}</p>
          <Button
            className="mt-6 w-full"
            variant="accent"
            disabled={items.length === 0 || loading}
            onClick={async () => {
              setLoading(true);
              try {
                const booking = await createBooking(items[0].eventId, items);
                setBookingId(booking._id);
                router.push(`/payment?bookingId=${booking._id}`);
              } catch (error) {
                push({
                  title: "Hold failed",
                  description: error instanceof Error ? error.message : "Inventory moved",
                  tone: "err",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Reserving…" : "Reserve and pay"}
          </Button>
        </Card>
      </div>
    </RequireAuth>
  );
}

const paymentMethods = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Debit / credit card" },
  { value: "netbanking", label: "Net banking" },
  { value: "wallet", label: "Wallet" },
];

export function PaymentScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const bookingIdFromStore = useCartStore((s) => s.bookingId);
  const paymentKey = useCartStore((s) => s.paymentKey);
  const setPaymentKey = useCartStore((s) => s.setPaymentKey);
  const push = useToastStore((s) => s.push);
  const clicking = useRef(false);
  const [bookingId, setBookingId] = useState(bookingIdFromStore ?? "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("bookingId");
    if (q) setBookingId(q);
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card className="p-6 sm:p-8">
          <Badge tone="warn">Razorpay sandbox</Badge>
          <h1 className="mt-3 font-display text-4xl">Pay now</h1>
          <p className="mt-2 text-sm text-ink/60">
            Choose a method, then pay. Repeated clicks share one idempotency key.
          </p>
          <p className="mt-4 text-sm">
            {items[0]?.eventTitle ?? "Held booking"} · {formatCurrency(bookingTotal(items))}
          </p>
          <Formik
            initialValues={{
              method: "",
              upiId: "",
              cardNumber: "",
              cardName: "",
              cardExpiry: "",
              cardCvv: "",
              bank: "",
              wallet: "",
            }}
            validationSchema={paymentSchema}
            onSubmit={async (values, helpers) => {
              if (clicking.current) {
                push({
                  title: "Payment already in flight",
                  description: "Same Pay Now click is ignored.",
                });
                helpers.setSubmitting(false);
                return;
              }
              clicking.current = true;
              const key = paymentKey ?? createIdempotencyKey(bookingId || "pay");
              setPaymentKey(key);
              try {
                const order = (await createPayment(bookingId, key, values.method)) as {
                  duplicate?: boolean;
                  razorpayOrderId?: string;
                };
                if (order.duplicate) {
                  push({ title: "Duplicate Pay Now blocked", description: "Idempotency key reused." });
                  return;
                }
                await verifyPayment({
                  bookingId,
                  razorpay_order_id: String(order.razorpayOrderId ?? "order_demo"),
                  razorpay_payment_id: `pay_${key.slice(-6)}`,
                  razorpay_signature: "demo_ok",
                });
                helpers.resetForm();
                router.push(`/confirmation/${bookingId || "bkg_1"}`);
              } catch (error) {
                helpers.setStatus(
                  error instanceof Error ? error.message : "Payment could not complete",
                );
                push({
                  title: "Payment could not complete",
                  description: error instanceof Error ? error.message : "Webhook will reconcile",
                  tone: "err",
                });
              } finally {
                clicking.current = false;
                helpers.setSubmitting(false);
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting, status }) => (
              <Form className="mt-6 grid gap-4" noValidate>
                <Field label="Payment method" error={touched.method ? errors.method : undefined}>
                  <Select
                    name="method"
                    value={values.method}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(touched.method && errors.method)}
                  >
                    <option value="">Select a method</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                {values.method === "upi" ? (
                  <Field label="UPI ID" error={touched.upiId ? errors.upiId : undefined}>
                    <Input
                      name="upiId"
                      placeholder="name@upi"
                      value={values.upiId}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={Boolean(touched.upiId && errors.upiId)}
                    />
                  </Field>
                ) : null}
                {values.method === "card" ? (
                  <>
                    <Field label="Name on card" error={touched.cardName ? errors.cardName : undefined}>
                      <Input
                        name="cardName"
                        value={values.cardName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.cardName && errors.cardName)}
                      />
                    </Field>
                    <Field
                      label="Card number"
                      error={touched.cardNumber ? errors.cardNumber : undefined}
                    >
                      <Input
                        name="cardNumber"
                        inputMode="numeric"
                        maxLength={16}
                        value={values.cardNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(touched.cardNumber && errors.cardNumber)}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Expiry (MM/YY)"
                        error={touched.cardExpiry ? errors.cardExpiry : undefined}
                      >
                        <Input
                          name="cardExpiry"
                          placeholder="12/28"
                          value={values.cardExpiry}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={Boolean(touched.cardExpiry && errors.cardExpiry)}
                        />
                      </Field>
                      <Field label="CVV" error={touched.cardCvv ? errors.cardCvv : undefined}>
                        <PasswordInput
                          name="cardCvv"
                          inputMode="numeric"
                          maxLength={4}
                          value={values.cardCvv}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={Boolean(touched.cardCvv && errors.cardCvv)}
                          autoComplete="cc-csc"
                        />
                      </Field>
                    </div>
                  </>
                ) : null}
                {values.method === "netbanking" ? (
                  <Field label="Bank" error={touched.bank ? errors.bank : undefined}>
                    <Select
                      name="bank"
                      value={values.bank}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={Boolean(touched.bank && errors.bank)}
                    >
                      <option value="">Select a bank</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="axis">Axis Bank</option>
                    </Select>
                  </Field>
                ) : null}
                {values.method === "wallet" ? (
                  <Field label="Wallet" error={touched.wallet ? errors.wallet : undefined}>
                    <Select
                      name="wallet"
                      value={values.wallet}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={Boolean(touched.wallet && errors.wallet)}
                    >
                      <option value="">Select a wallet</option>
                      <option value="paytm">Paytm</option>
                      <option value="phonepe">PhonePe</option>
                      <option value="amazonpay">Amazon Pay</option>
                    </Select>
                  </Field>
                ) : null}
                {status ? (
                  <p className="text-sm text-red-600" role="alert">
                    {status}
                  </p>
                ) : null}
                <Button className="w-full" variant="accent" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Paying…" : "Pay Now"}
                </Button>
              </Form>
            )}
          </Formik>
        </Card>
      </div>
    </RequireAuth>
  );
}

export function ConfirmationScreen() {
  const { id } = useParams<{ id: string }>();
  const clear = useCartStore((s) => s.clear);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    if (!id) return;
    getBooking(id)
      .then((booking) => {
        setNumber(booking.bookingNumber);
        setAmount(booking.totalAmount);
      })
      .catch(() => {
        setNumber(id);
      })
      .finally(() => {
        setLoading(false);
        clear();
      });
  }, [clear, id]);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-rust">You are in</p>
        <h1 className="mt-2 font-display text-5xl">Booking confirmed</h1>
        <p className="mt-3 text-ink/65">
          {loading ? "Loading…" : `${number} · ${formatCurrency(amount)}`}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/bookings">
            <Button>My bookings</Button>
          </Link>
          <Link href="/events">
            <Button variant="outline">More events</Button>
          </Link>
        </div>
      </div>
    </RequireAuth>
  );
}

export function BookingsScreen() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getBooking>>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/api/services").then(({ listMyBookings }) =>
      listMyBookings()
        .then(setRows)
        .finally(() => setLoading(false)),
    );
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">My bookings</h1>
        <div className="mt-6 grid gap-3">
          {loading ? <p>Loading…</p> : null}
          {rows.map((booking) => (
            <Link key={booking._id} href={`/bookings/${booking._id}`}>
              <Card className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{booking.eventTitle ?? booking.bookingNumber}</p>
                  <p className="text-sm text-ink/55">
                    {booking.bookingNumber} · {formatDateTime(booking.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={booking.status === "CONFIRMED" ? "ok" : "warn"}>
                    {booking.status}
                  </Badge>
                  <span>{formatCurrency(booking.totalAmount)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}

export function BookingDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const push = useToastStore((s) => s.push);
  const [booking, setBooking] = useState<Awaited<ReturnType<typeof getBooking>> | null>(null);

  useEffect(() => {
    if (!id) return;
    getBooking(id).then(setBooking);
  }, [id]);

  if (!booking) return <div className="p-10">Loading…</div>;

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl">{booking.bookingNumber}</h1>
        <p className="mt-2 text-ink/60">{booking.eventTitle}</p>
        <Card className="mt-6 divide-y divide-ink/8 p-0">
          {booking.items.map((item) => (
            <div key={item.ticketId} className="flex justify-between p-4">
              <span>
                {item.ticketName} × {item.quantity}
              </span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
        </Card>
        <div className="mt-4 flex gap-2">
          <Badge>{booking.status}</Badge>
          <Badge tone="teal">{booking.paymentStatus}</Badge>
        </div>
        {booking.status !== "CANCELLED" ? (
          <Button
            className="mt-6"
            variant="outline"
            onClick={async () => {
              const { cancelBooking } = await import("@/lib/api/services");
              await cancelBooking(booking._id);
              push({ title: "Cancellation requested" });
            }}
          >
            Cancel booking
          </Button>
        ) : null}
      </div>
    </RequireAuth>
  );
}
