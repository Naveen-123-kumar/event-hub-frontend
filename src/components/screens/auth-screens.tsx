"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import {
  forgotPasswordRequest,
  oauthUrl,
  registerRequest,
  resetPasswordRequest,
  verifyEmailByTokenRequest,
  verifyEmailRequest,
} from "@/lib/api/services";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "@/lib/validation/schemas";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";

function AuthFrame({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:max-w-6xl lg:px-8 lg:py-20">
      <p className="text-xs uppercase tracking-[0.24em] text-rust">EventHub</p>
      <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-md text-ink/65">{body}</p>
      <Card className="mt-8 p-6 sm:p-8 lg:max-w-md">{children}</Card>
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      push({ title: "Social login failed", description: error, tone: "err" });
    }
    if (params.get("verified") === "1") {
      push({ title: "Email verified", description: "You can sign in now." });
    }
  }, [params, push]);

  return (
    <AuthFrame title="Come in quietly." body="JWT access lasts 12 minutes. We refresh in the background so checkout does not drop.">
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginSchema}
        onSubmit={async (values, helpers) => {
          try {
            const user = await login(values.email, values.password);
            helpers.resetForm();
            push({ title: "Welcome back", description: user.email });
            router.replace(isAdminRole(user.role) ? "/admin" : "/events");
          } catch (error) {
            helpers.setStatus(error instanceof Error ? error.message : "Try again");
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
            <Field label="Password" error={touched.password ? errors.password : undefined}>
              <PasswordInput
                name="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.password && errors.password)}
                autoComplete="current-password"
              />
            </Field>
            <FormError message={status} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.assign(oauthUrl("google"));
                }}
              >
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.assign(oauthUrl("linkedin"));
                }}
              >
                LinkedIn
              </Button>
            </div>
            <p className="text-sm text-ink/60">
              <Link href="/forgot-password" className="underline">
                Forgot password
              </Link>
              {" · "}
              <Link href="/register" className="underline">
                Create account
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </AuthFrame>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const push = useToastStore((s) => s.push);

  return (
    <AuthFrame
      title="Join the room."
      body="We email a verification link. Open that mail and click Verify email to activate the account."
    >
      <Formik
        initialValues={{ email: "", password: "", confirmPassword: "" }}
        validationSchema={registerSchema}
        onSubmit={async (values, helpers) => {
          try {
            const email = values.email;
            await registerRequest(email, values.password);
            helpers.resetForm();
            push({
              title: "Check your inbox",
              description: "Click the verification link in the email we sent.",
            });
            router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          } catch (error) {
            helpers.setStatus(error instanceof Error ? error.message : "Try another email");
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
            <Field
              label="Password"
              hint="At least 8 characters"
              error={touched.password ? errors.password : undefined}
            >
              <PasswordInput
                name="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.password && errors.password)}
                autoComplete="new-password"
              />
            </Field>
            <Field
              label="Confirm password"
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
            >
              <PasswordInput
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                autoComplete="new-password"
              />
            </Field>
            <FormError message={status} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
            <Link href="/login" className="text-sm underline">
              Already have an account
            </Link>
          </Form>
        )}
      </Formik>
    </AuthFrame>
  );
}

export function VerifyEmailScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const linkError = params.get("error");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmailByTokenRequest(token)
      .then(() => {
        if (cancelled) return;
        push({ title: "Email verified", description: "You can sign in now." });
        router.replace("/login?verified=1");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        push({
          title: "Verification failed",
          description: error instanceof Error ? error.message : "Invalid or expired link",
          tone: "err",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [push, router, token]);

  if (token) {
    return (
      <AuthFrame title="Verifying…" body="Hang on while we confirm the link you clicked.">
        <p className="text-sm text-ink/60">This only takes a moment.</p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Confirm your inbox."
      body="Open the email we sent and click Verify email. You can also enter a 6-digit OTP if you requested one."
    >
      {linkError ? (
        <p className="mb-4 text-sm text-red-600">
          {linkError === "missing" ? "That link is missing a token." : "That verification link is invalid or expired."}
        </p>
      ) : null}
      <Formik
        initialValues={{ otp: "" }}
        validationSchema={verifyOtpSchema}
        onSubmit={async (values, helpers) => {
          try {
            await verifyEmailRequest(email, values.otp);
            helpers.resetForm();
            push({ title: "Email verified" });
            router.push("/login?verified=1");
          } catch (error) {
            helpers.setStatus(error instanceof Error ? error.message : "Invalid OTP");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting, status }) => (
          <Form className="grid gap-4" noValidate>
            <Field label="Email">
              <Input value={email} readOnly />
            </Field>
            <Field label="OTP" error={touched.otp ? errors.otp : undefined}>
              <Input
                name="otp"
                inputMode="numeric"
                maxLength={6}
                value={values.otp}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.otp && errors.otp)}
              />
            </Field>
            <FormError message={status} />
            <Button type="submit" disabled={isSubmitting || !email}>
              {isSubmitting ? "Verifying…" : "Verify OTP"}
            </Button>
          </Form>
        )}
      </Formik>
    </AuthFrame>
  );
}

export function ForgotPasswordScreen() {
  const push = useToastStore((s) => s.push);

  return (
    <AuthFrame title="Reset the lock." body="We email a one-time link. It expires in 15 minutes.">
      <Formik
        initialValues={{ email: "" }}
        validationSchema={forgotPasswordSchema}
        onSubmit={async (values, helpers) => {
          try {
            await forgotPasswordRequest(values.email);
            helpers.resetForm();
            push({ title: "If that account exists, a reset email is on the way" });
            helpers.setStatus(undefined);
          } catch (error) {
            helpers.setStatus(error instanceof Error ? error.message : "Could not send reset email");
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
            <FormError message={status} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </Form>
        )}
      </Formik>
    </AuthFrame>
  );
}

export function ResetPasswordScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const push = useToastStore((s) => s.push);

  return (
    <AuthFrame title="Choose a new one." body="Minimum 8 characters, hashed with bcrypt on the API.">
      {!token ? (
        <p className="text-sm text-red-600">This reset link is missing a token. Request a new one from Forgot password.</p>
      ) : null}
      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={resetPasswordSchema}
        onSubmit={async (values, helpers) => {
          if (!token) {
            helpers.setStatus("Reset token is required");
            helpers.setSubmitting(false);
            return;
          }
          try {
            await resetPasswordRequest(token, values.password);
            helpers.resetForm();
            push({ title: "Password updated" });
            router.push("/login");
          } catch (error) {
            helpers.setStatus(error instanceof Error ? error.message : "Could not reset password");
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur, isSubmitting, status }) => (
          <Form className="grid gap-4" noValidate>
            <Field label="New password" error={touched.password ? errors.password : undefined}>
              <PasswordInput
                name="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.password && errors.password)}
                autoComplete="new-password"
              />
            </Field>
            <Field
              label="Confirm password"
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
            >
              <PasswordInput
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                autoComplete="new-password"
              />
            </Field>
            <FormError message={status} />
            <Button type="submit" disabled={isSubmitting || !token}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </Form>
        )}
      </Formik>
    </AuthFrame>
  );
}

export function OAuthSuccessScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh") ?? token;
    if (!token || !refresh) {
      push({ title: "Social login failed", description: "No session token returned", tone: "err" });
      router.replace("/login");
      return;
    }
    setSession(token, refresh);
    router.replace("/events");
  }, [params, push, router, setSession]);

  return <p className="px-6 py-20 text-center">Finishing sign-in…</p>;
}
