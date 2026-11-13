# Production failure handling

These are the intended system behaviors. They are not “catch and ignore”.

## 1. Payment succeeds but the booking API times out

**Problem:** Razorpay captured funds; the HTTP `verify` call to Express never returned, so the UI still shows PENDING.

**Solution:** Payment is the source of truth in MySQL. Razorpay webhook (`payment.captured`) is idempotent and looks up the order → bookingId. A worker then sets Mongo booking `CONFIRMED` / `paymentStatus=SUCCESS`. The UI polls `GET /bookings/:id` or waits for a notification. Never create a second charge.

Frontend: after Pay Now, confirmation still loads the booking; `reconcileTimedOutBooking` encodes this state machine.

## 2. Payment webhook arrives twice

**Problem:** Gateway retries.

**Solution:** Unique index on `payment_webhook_events.eventId`. Second insert is a duplicate key → ack 200 without mutating booking or inventory. Idempotency key on the payment row (`razorpayPaymentId` unique).

## 3. Redis becomes unavailable

**Problem:** Cache/getset fails.

**Solution:** Cache is a performance layer, not a correctness layer. Client and API treat Redis errors as a miss and go to Mongo/MySQL. Circuit breaker skips Redis for N seconds. Inventory holds stay in the Mongo transaction, not in Redis.

Frontend `MemoryCache` is a short TTL helper only; API health failure already degrades to demo/live DB.

## 4. MongoDB temporarily unavailable

**Problem:** Event/booking reads and writes fail.

**Solution:** API returns 503 with `Retry-After`. Checkout is blocked (cannot hold inventory). Payments already captured still reconcile via webhook + retry queue when Mongo returns. Read replicas / driver retryWrites cover blips. Frontend shows a hard error on reserve, not a fake success.

## 5. Email server is unavailable

**Problem:** OTP or ticket mail cannot send.

**Solution:** Notification service writes a durable outbox row, then Nodemailer. SMTP failure leaves `queued=true, delivered=false`. A worker retries with backoff. OTP is still stored hashed in Mongo so the user can verify when mail arrives. UI never assumes the mail was delivered.

## 6. 500 users buy the last 20 tickets

**Problem:** Oversell.

**Solution:** `availableQuantity` is decremented in a Mongo transaction with a predicate `availableQuantity >= n`. Losers get 409. Application lock or findOneAndUpdate with the condition is required; “read then write” is not enough. Frontend `allocateScarceInventory` documents first-20-win; the API must enforce it.

## 7. A 1 GB CSV is uploaded

**Problem:** Loading the file into RAM / multer memory storage kills the process.

**Solution:** Direct-to-S3 multipart upload from the browser (presigned). API never buffers the file. A worker streams the object (`S3.createReadStream` + CSV parser) in chunks. Frontend rejects local parse over 50MB.

## 8. Admin requests a 1M-row report

**Problem:** JSON array of a million payments.

**Solution:** Stream CSV (`res.write` / cursor). Pagination for the on-screen table. No `find().toArray()` of the full set. Frontend export downloads the current page or hits the streamed endpoint.

## 9. Worker thread processing fails

**Problem:** CPU work (hashing a huge CSV, image, report) throws in a Worker.

**Solution:** Parent catches `error` / `exit !== 0`, marks the job failed in the outbox, retries with a new worker, dead-letters after N tries. The HTTP request that enqueued the job already returned 202. UI shows job status, not a hung request.

## 10. Same customer clicks Pay Now multiple times

**Problem:** Two Razorpay orders for one hold.

**Solution:** Idempotency-Key generated once per checkout session (Zustand `paymentKey`). Server stores the key → order id. Duplicates return the original order. UI click lock (`clicking.current`) plus key reuse. Webhook still unique on payment id.
