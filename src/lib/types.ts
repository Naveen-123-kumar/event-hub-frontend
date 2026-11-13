export type UserRole =
  | "super_admin"
  | "organization_admin"
  | "event_manager"
  | "customer"
  | "support_agent";

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type TicketStatus = "ACTIVE" | "INACTIVE";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface AccessTokenPayload {
  userId: string;
  role: UserRole;
  organizationId?: string;
  email?: string;
  exp?: number;
  iat?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  isEmailVerified?: boolean;
}

export interface EventRecord {
  _id: string;
  title: string;
  description?: string;
  venue: string;
  city: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  organizationId?: string;
  imageUrl?: string;
  category?: string;
}

export interface TicketRecord {
  _id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  saleStartDate: string;
  saleEndDate: string;
  status: TicketStatus;
}

export interface BookingItem {
  ticketId: string;
  ticketName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BookingRecord {
  _id: string;
  bookingNumber: string;
  userId: string;
  eventId: string;
  eventTitle?: string;
  items: BookingItem[];
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  bookingNumber?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  type: "booking" | "payment" | "system" | "event";
  read: boolean;
  createdAt: string;
}

export interface CartItem {
  eventId: string;
  eventTitle: string;
  ticketId: string;
  ticketName: string;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CmsFaq {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export interface CmsBanner {
  id: number;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
}

export interface CmsPage {
  slug: string;
  title: string;
  excerpt?: string;
  paragraphs: string[];
}
