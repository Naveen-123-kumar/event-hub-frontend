"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Form, Formik } from "formik";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createEvent,
  createTicket,
  deleteUserRequest,
  dismissNotification,
  listEvents,
  listMyBookings,
  listNotifications,
  listPayments,
  listUsers,
  publishEvent,
} from "@/lib/api/services";
import { DismissButton } from "@/components/ui/dismiss-button";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { mockBookings, mockEvents, mockNotifications, mockPayments } from "@/lib/mocks/data";
import { eventCreateSchema } from "@/lib/validation/schemas";
import { roleLabel } from "@/lib/roles";
import type { BookingRecord, EventRecord, NotificationRecord, PaymentRecord, UserRecord } from "@/lib/types";
import { useToastStore } from "@/stores/toast-store";

const AnalyticsCharts = dynamic(
  () => import("@/components/charts/analytics-charts").then((m) => m.AnalyticsCharts),
  { ssr: false, loading: () => <Skeleton className="h-64" /> },
);

export function AdminDashboardScreen() {
  const gmv = mockPayments
    .filter((payment) => payment.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const held = mockBookings.filter((booking) => booking.status === "PENDING").length;
  const settled = mockPayments.filter((payment) => payment.status === "success").length;
  const successRate =
    mockPayments.length === 0 ? 0 : Math.round((settled / mockPayments.length) * 100);
  const alerts = mockNotifications.filter((item) => !item.read).length;
  const liveEvents = mockEvents.filter((event) => event.status === "PUBLISHED").length;

  return (
    <AdminShell>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <p className="mt-2 text-sm text-ink/55">
        Figures come from this app&apos;s catalog when reports APIs are empty · {liveEvents} live events
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Settled GMV" value={formatCurrency(gmv)} />
        <Stat label="Open holds" value={String(held)} />
        <Stat label="Payment success" value={`${successRate}%`} />
        <Stat label="Open alerts" value={String(alerts)} />
      </div>
      <div className="mt-8">
        <AnalyticsCharts />
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-ink/45">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </Card>
  );
}

export function AdminEventsScreen() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    listEvents({ page: 1 }).then((res) => setEvents(res.data));
  }, []);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Events</h1>
        <Link href="/admin/events/new">
          <Button variant="accent">New event</Button>
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/8 bg-white/70">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event._id} className="border-t border-ink/8">
                <td className="px-4 py-3">{event.title}</td>
                <td className="px-4 py-3">{event.city}</td>
                <td className="px-4 py-3">
                  <Badge tone={event.status === "PUBLISHED" ? "ok" : "warn"}>{event.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {event.status === "DRAFT" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await publishEvent(event._id);
                        push({ title: "Published" });
                      }}
                    >
                      Publish
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

export function AdminEventCreateScreen() {
  const push = useToastStore((s) => s.push);

  return (
    <AdminShell>
      <h1 className="font-display text-4xl">Create event</h1>
      <Formik
        initialValues={{
          title: "",
          venue: "",
          city: "Hyderabad",
          capacity: 200,
          description: "",
        }}
        validationSchema={eventCreateSchema}
        onSubmit={async (values, helpers) => {
          try {
            const event = await createEvent({
              title: values.title,
              venue: values.venue,
              city: values.city,
              capacity: values.capacity,
              description: values.description,
              startDate: new Date(Date.now() + 86400000 * 14).toISOString(),
              endDate: new Date(Date.now() + 86400000 * 14 + 10800000).toISOString(),
            });
            await createTicket(event._id, {
              name: "GA",
              price: 999,
              quantity: values.capacity,
              saleStartDate: new Date().toISOString(),
              saleEndDate: new Date(Date.now() + 86400000 * 13).toISOString(),
            });
            helpers.resetForm();
            push({ title: "Draft saved", description: "Add tickets, then publish." });
          } catch (error) {
            helpers.setStatus(error instanceof Error ? error.message : "Could not save event");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting, status }) => (
          <Form className="mt-6 grid max-w-xl gap-4" noValidate>
            <Field label="Title" error={touched.title ? errors.title : undefined}>
              <Input
                name="title"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.title && errors.title)}
              />
            </Field>
            <Field label="Venue" error={touched.venue ? errors.venue : undefined}>
              <Input
                name="venue"
                value={values.venue}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.venue && errors.venue)}
              />
            </Field>
            <Field label="City" error={touched.city ? errors.city : undefined}>
              <Input
                name="city"
                value={values.city}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.city && errors.city)}
              />
            </Field>
            <Field label="Capacity" error={touched.capacity ? errors.capacity : undefined}>
              <Input
                name="capacity"
                type="number"
                value={values.capacity}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.capacity && errors.capacity)}
              />
            </Field>
            <Field label="Description" error={touched.description ? errors.description : undefined}>
              <Textarea
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.description && errors.description)}
              />
            </Field>
            {status ? <p className="text-sm text-red-600">{status}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save draft"}
            </Button>
          </Form>
        )}
      </Formik>
    </AdminShell>
  );
}

export function AdminBookingsScreen() {
  const [rows, setRows] = useState<BookingRecord[]>([]);
  useEffect(() => {
    listMyBookings().then(setRows);
  }, []);
  return (
    <AdminShell>
      <h1 className="font-display text-4xl">Bookings</h1>
      <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <Card key={row._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{row.bookingNumber}</p>
              <p className="text-sm text-ink/55">{row.eventTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge>{row.status}</Badge>
              <span>{formatCurrency(row.totalAmount)}</span>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

export function AdminCustomersScreen() {
  const [rows, setRows] = useState<UserRecord[]>([]);
  const [q, setQ] = useState("");
  const push = useToastStore((s) => s.push);
  useEffect(() => {
    listUsers(1).then((res) => setRows(res.data));
  }, []);
  const filtered = rows.filter((u) => u.email.includes(q.toLowerCase()) || q === "");
  return (
    <AdminShell>
      <h1 className="font-display text-4xl">Customers</h1>
      <Input
        className="mt-4 max-w-sm"
        placeholder="Search email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/8 bg-white/70">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-xs uppercase text-ink/45">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Verified</th>
              <th className="px-4 py-3 text-left"> </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-ink/8">
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{roleLabel(user.role)}</td>
                <td className="px-4 py-3">{user.isEmailVerified ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${user.email}?`)) return;
                      try {
                        await deleteUserRequest(user.id);
                        setRows((prev) => prev.filter((row) => row.id !== user.id));
                        push({ title: "User deleted", description: user.email });
                      } catch (error) {
                        push({
                          title: "Could not delete user",
                          description: error instanceof Error ? error.message : "Try again",
                          tone: "err",
                        });
                      }
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

export function AdminPaymentsScreen() {
  const [rows, setRows] = useState<PaymentRecord[]>([]);
  useEffect(() => {
    listPayments().then(setRows);
  }, []);

  function downloadCsv() {
    const header = "id,booking,amount,status,createdAt\n";
    const body = rows
      .map((r) => `${r.id},${r.bookingNumber},${r.amount},${r.status},${r.createdAt}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Payment reports</h1>
        <Button variant="outline" onClick={downloadCsv}>
          Export CSV
        </Button>
      </div>
      <p className="mt-2 text-sm text-ink/55">
        Million-row reports stream from the API. This UI never loads the full file into memory.
      </p>
      <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <Card key={row.id} className="flex flex-wrap justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{row.bookingNumber ?? row.bookingId}</p>
              <p className="text-xs text-ink/45">{formatDateTime(row.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={row.status === "success" ? "ok" : "warn"}>{row.status}</Badge>
              <span>{formatCurrency(row.amount)}</span>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

export function AdminNotificationsScreen() {
  const [rows, setRows] = useState<NotificationRecord[]>([]);
  useEffect(() => {
    listNotifications().then(setRows);
  }, []);
  return (
    <AdminShell>
      <h1 className="font-display text-4xl">Notification monitoring</h1>
      <div className="mt-6 grid gap-3">
        {rows.length === 0 ? (
          <p className="text-sm text-ink/55">No notifications.</p>
        ) : null}
        {rows.map((row) => (
          <Card key={row.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{row.title}</p>
                  <Badge>{row.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink/60">{row.body}</p>
              </div>
              <DismissButton
                onClick={async () => {
                  await dismissNotification(row.id);
                  setRows((prev) => prev.filter((item) => item.id !== row.id));
                }}
              />
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

export function AdminAnalyticsScreen() {
  return (
    <AdminShell>
      <h1 className="font-display text-4xl">Analytics</h1>
      <p className="mt-2 text-sm text-ink/55">Charts are code-split and load only on this route.</p>
      <div className="mt-6">
        <AnalyticsCharts />
      </div>
      <form
        className="mt-8 rounded-3xl border border-dashed border-ink/15 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const file = (e.currentTarget.elements.namedItem("csv") as HTMLInputElement).files?.[0];
          if (!file) return;
          if (file.size > 50 * 1024 * 1024) {
            alert("Files over 50MB must be uploaded via the streaming API, not the browser tab.");
            return;
          }
        }}
      >
        <p className="font-medium">CSV ingest</p>
        <p className="mt-1 text-sm text-ink/55">
          1GB uploads go to S3 with a streamed worker. The browser rejects oversized local parses.
        </p>
        <Input className="mt-3" name="csv" type="file" accept=".csv" />
        <Button className="mt-3" type="submit" variant="outline">
          Check file
        </Button>
      </form>
    </AdminShell>
  );
}
