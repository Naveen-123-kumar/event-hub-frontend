"use client";

import { Form, Formik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/layout/require-auth";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import {
  deleteMyAccountRequest,
  dismissNotification,
  listFaqs,
  listNotifications,
  markNotificationRead,
} from "@/lib/api/services";
import { deleteAccountSchema } from "@/lib/validation/schemas";
import { useToastStore } from "@/stores/toast-store";
import { DismissButton } from "@/components/ui/dismiss-button";
import { formatDateTime } from "@/lib/format";
import { roleLabel } from "@/lib/roles";
import type { CmsFaq, NotificationRecord } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

export function NotificationsScreen() {
  const [items, setItems] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    listNotifications().then(setItems);
  }, []);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-4xl">Notifications</h1>
        <div className="mt-6 grid gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-ink/55">No notifications.</p>
          ) : null}
          {items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-ink/65">{item.body}</p>
                  <p className="mt-2 text-xs text-ink/40">{formatDateTime(item.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!item.read ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await markNotificationRead(item.id);
                        setItems((prev) =>
                          prev.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
                        );
                      }}
                    >
                      Mark read
                    </Button>
                  ) : (
                    <Badge>Read</Badge>
                  )}
                  <DismissButton
                    onClick={async () => {
                      await dismissNotification(item.id);
                      setItems((prev) => prev.filter((row) => row.id !== item.id));
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const push = useToastStore((s) => s.push);

  return (
    <RequireAuth>
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="font-display text-4xl">Profile</h1>
        <Card className="mt-6 grid gap-3 p-6">
          <Row label="Email" value={user?.email} />
          <Row label="Role" value={user?.role ? roleLabel(user.role) : ""} />
          <Row label="User ID" value={user?.id} />
          <Row label="Organization" value={user?.organizationId ?? "Personal"} />
          <Button variant="outline" onClick={logout}>
            Sign out
          </Button>
        </Card>
        <Card className="mt-6 grid gap-3 p-6">
          <h2 className="font-display text-2xl">Delete account</h2>
          <p className="text-sm text-ink/60">
            This removes your user record and sessions. Type your email and DELETE to confirm.
          </p>
          <Formik
            initialValues={{ email: "", confirm: "" }}
            validationSchema={deleteAccountSchema}
            onSubmit={async (values, helpers) => {
              if (values.email !== user?.email) {
                helpers.setFieldError("email", "Email must match your account");
                helpers.setSubmitting(false);
                return;
              }
              try {
                await deleteMyAccountRequest();
                helpers.resetForm();
                logout();
                push({ title: "Account deleted" });
                router.replace("/register");
              } catch (error) {
                helpers.setStatus(error instanceof Error ? error.message : "Could not delete account");
              } finally {
                helpers.setSubmitting(false);
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting, status }) => (
              <Form className="grid gap-4" noValidate>
                <Field label="Email" error={touched.email ? errors.email : undefined}>
                  <Input
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(touched.email && errors.email)}
                  />
                </Field>
                <Field label='Type DELETE' error={touched.confirm ? errors.confirm : undefined}>
                  <Input
                    name="confirm"
                    value={values.confirm}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(touched.confirm && errors.confirm)}
                  />
                </Field>
                {status ? <p className="text-sm text-red-600">{status}</p> : null}
                <Button type="submit" variant="danger" disabled={isSubmitting}>
                  {isSubmitting ? "Deleting…" : "Delete my account"}
                </Button>
              </Form>
            )}
          </Formik>
        </Card>
      </div>
    </RequireAuth>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-ink/45">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export function FaqScreen() {
  const [faqs, setFaqs] = useState<CmsFaq[]>([]);
  useEffect(() => {
    listFaqs().then(setFaqs);
  }, []);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl">FAQ</h1>
      <p className="mt-2 text-sm text-ink/55">Sourced from Strapi when the CMS is up.</p>
      <div className="mt-6 grid gap-3">
        {faqs.map((faq) => (
          <Card key={faq.id} className="p-5">
            <p className="font-medium">{faq.question}</p>
            <p className="mt-2 text-sm text-ink/65">{faq.answer}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AboutScreen() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-5xl">About EventHub</h1>
      <p className="mt-4 text-ink/70">
        Multi-tenant ticketing: Next.js for the rooms, Express for holds, Mongo for events, MySQL for money, Redis for
        the hot path, Strapi for the copy.
      </p>
    </div>
  );
}

export function TermsScreen() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-5xl">Terms</h1>
      <p className="mt-4 text-ink/70">
        Bookings are inventory holds. Confirmed tickets require a successful payment webhook. Refunds are organization
        policy.
      </p>
    </div>
  );
}
