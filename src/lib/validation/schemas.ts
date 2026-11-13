import * as Yup from "yup";

const email = Yup.string().trim().required("Email is required").email("Enter a valid email address");

const password = Yup.string()
  .required("Password is required")
  .min(8, "Password must be at least 8 characters");

export const loginSchema = Yup.object({
  email,
  password: Yup.string().required("Password is required").min(1, "Password is required"),
});

export const registerSchema = Yup.object({
  email,
  password,
  confirmPassword: Yup.string()
    .required("Confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

export const forgotPasswordSchema = Yup.object({
  email,
});

export const resetPasswordSchema = Yup.object({
  password,
  confirmPassword: Yup.string()
    .required("Confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

export const verifyOtpSchema = Yup.object({
  otp: Yup.string()
    .required("OTP is required")
    .matches(/^\d{6}$/, "OTP must be 6 digits"),
});

export const eventCreateSchema = Yup.object({
  title: Yup.string().trim().required("Title is required").min(3, "Title must be at least 3 characters"),
  venue: Yup.string().trim().required("Venue is required"),
  city: Yup.string().trim().required("City is required"),
  capacity: Yup.number()
    .typeError("Capacity must be a number")
    .required("Capacity is required")
    .min(1, "Capacity must be at least 1"),
  description: Yup.string().trim().required("Description is required").min(10, "Description must be at least 10 characters"),
});

export const paymentSchema = Yup.object({
  method: Yup.string()
    .oneOf(["upi", "card", "netbanking", "wallet"], "Choose a payment method")
    .required("Choose a payment method"),
  upiId: Yup.string().when("method", {
    is: "upi",
    then: (schema) =>
      schema
        .required("UPI ID is required")
        .matches(/^[\w.-]+@[\w.-]+$/, "Enter a valid UPI ID"),
    otherwise: (schema) => schema.strip(),
  }),
  cardNumber: Yup.string().when("method", {
    is: "card",
    then: (schema) =>
      schema
        .required("Card number is required")
        .matches(/^\d{16}$/, "Card number must be 16 digits"),
    otherwise: (schema) => schema.strip(),
  }),
  cardName: Yup.string().when("method", {
    is: "card",
    then: (schema) => schema.trim().required("Name on card is required"),
    otherwise: (schema) => schema.strip(),
  }),
  cardExpiry: Yup.string().when("method", {
    is: "card",
    then: (schema) =>
      schema
        .required("Expiry is required")
        .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY"),
    otherwise: (schema) => schema.strip(),
  }),
  cardCvv: Yup.string().when("method", {
    is: "card",
    then: (schema) =>
      schema.required("CVV is required").matches(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
    otherwise: (schema) => schema.strip(),
  }),
  bank: Yup.string().when("method", {
    is: "netbanking",
    then: (schema) => schema.required("Select a bank"),
    otherwise: (schema) => schema.strip(),
  }),
  wallet: Yup.string().when("method", {
    is: "wallet",
    then: (schema) => schema.required("Select a wallet"),
    otherwise: (schema) => schema.strip(),
  }),
});

export const deleteAccountSchema = Yup.object({
  email: email,
  confirm: Yup.string()
    .required("Type DELETE to confirm")
    .oneOf(["DELETE"], "Type DELETE to confirm"),
});
