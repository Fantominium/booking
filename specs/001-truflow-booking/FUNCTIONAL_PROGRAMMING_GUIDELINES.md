# Functional Programming Guidelines - TruFlow Booking Platform

**Status**: ACTIVE  
**Effective**: 2026-02-09  
**Enforcement**: ESLint + Pre-commit Hooks + Code Review Gate

---

## Overview

The TruFlow Booking Platform is built entirely using **functional programming patterns**. This document outlines the requirements, patterns, and examples that all developers must follow.

**Key Principle**: All code is written as pure functions with immutable data transformations. No class-based code, no stateful objects, no direct DOM manipulation.

---

## Core Requirements (FR-055 through FR-068)

### 1. NO Class-Based Code (FR-055)

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - class-based component
class BookingForm extends React.Component {
  state = { email: '' };
  handleChange = (e) => this.setState({ email: e.target.value });
  render() { /* ... */ }
}

// ❌ NOT ALLOWED - class-based service
class AvailabilityService {
  slots: Slot[] = [];
  calculate() { /* mutates this.slots */ }
}

// ❌ NOT ALLOWED - using `new` keyword (except frameworks)
const booking = new Booking({ serviceId: 1 });
```

**REQUIRED**:

```typescript
// ✅ CORRECT - functional component
function BookingForm() {
  const [email, setEmail] = useState('');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  return /* ... */;
}

// ✅ CORRECT - functional service
function calculateAvailability(
  service: Service,
  bookings: Booking[],
  businessHours: BusinessHours[]
): TimeSlot[] {
  // pure function - no side effects
  return /* computed slots */;
}

// ✅ CORRECT - data creation without `new`
const booking = { serviceId: 1, startTime: '10:00' };
```

---

### 2. Functional React Components (FR-056)

**All React components MUST be functional components using React hooks.**

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - class component
class Dashboard extends Component {
  componentDidMount() { /* */ }
  render() { return /* ... */ }
}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - functional component with hooks
function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  useEffect(() => {
    fetchTodayBookings().then(setBookings);
  }, []);
  
  return /* ... */;
}
```

**Hook Patterns**:

- `useState` for local component state
- `useEffect` for side effects (data fetching, subscriptions)
- `useContext` for global state (auth, theme)
- `useCallback` for memoized event handlers
- `useMemo` for expensive computations
- Custom hooks for reusable logic

---

### 3. Pure Service Functions (FR-057)

**All service functions MUST be pure functions.**

**Pure Function Rules**:

- Same inputs always produce same outputs
- No side effects (no mutations, no API calls in function body)
- No dependence on external state
- Deterministic and testable

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - impure function with side effects
let totalBookings = 0;

function createBooking(booking: Booking) {
  totalBookings++; // ❌ modifying external state
  db.save(booking); // ❌ side effect
  return booking;
}

// ❌ NOT ALLOWED - function depends on external state
const config = { maxBookings: 8 }; // global
function isDateFull(date: string): boolean {
  const count = db.countBookings(date); // ❌ side effect
  return count >= config.maxBookings; // ❌ depends on global
}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - pure function
function createBooking(
  booking: Booking,
  stripeClient: StripeClient,
  emailQueue: EmailQueue
): Promise<BookingResult> {
  // Dependencies injected
  return stripeClient.createPaymentIntent(booking)
    .then((intent) => ({
      ok: true,
      data: { ...booking, stripeIntentId: intent.id }
    }))
    .catch((error) => ({
      ok: false,
      error: error.message
    }));
}

// ✅ CORRECT - pure calculation
function isDateFull(
  date: string,
  bookings: Booking[],
  maxBookingsPerDay: number
): boolean {
  const count = bookings.filter(b => isSameDay(b.startTime, date)).length;
  return count >= maxBookingsPerDay;
}
```

---

### 4. Immutable Data Transformations (FR-058)

**All data updates MUST use immutable patterns.**

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - direct mutation
const bookings = [/* ... */];
bookings[0].status = 'CONFIRMED'; // ❌ mutating array element
bookings.push(newBooking); // ❌ mutating array

// ❌ NOT ALLOWED - object mutation
const booking = { status: 'PENDING' };
booking.status = 'CONFIRMED'; // ❌ mutating object

// ❌ NOT ALLOWED - array mutation in loop
for (let i = 0; i < bookings.length; i++) {
  bookings[i].status = 'CONFIRMED'; // ❌ mutating
}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - immutable update
const bookings = [/* ... */];
const updated = bookings.map((b, i) =>
  i === 0 ? { ...b, status: 'CONFIRMED' } : b
);

// ✅ CORRECT - spreading
const booking = { status: 'PENDING' };
const confirmed = { ...booking, status: 'CONFIRMED' };

// ✅ CORRECT - array methods
const confirmed = bookings
  .map((b) => ({ ...b, status: 'CONFIRMED' }));

// ✅ CORRECT - filter and map
const updated = bookings
  .filter((b) => b.date === targetDate)
  .map((b) => ({ ...b, status: 'CONFIRMED' }));

// ✅ CORRECT - reduce for complex transformations
const bookingsByDate = bookings.reduce((acc, b) => ({
  ...acc,
  [formatDate(b.startTime)]: [...(acc[formatDate(b.startTime)] || []), b]
}), {} as Record<string, Booking[]>);
```

---

### 5. Custom Hooks for Logic Reuse (FR-059)

**Complex component logic MUST be extracted into custom hooks.**

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - logic mixed in component
function CheckoutForm() {
  const [formData, setFormData] = useState({ email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e) => { /* validation logic */ };
  const handleSubmit = (e) => { /* submission logic */ };
  // 150+ lines of form logic in component
  
  return /* ... */;
}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - extract logic into custom hook
function useCheckoutForm(onSubmit: (data: CheckoutData) => Promise<void>) {
  const [formData, setFormData] = useState({ email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email';
    if (formData.phone.length < 10) newErrors.phone = 'Invalid phone';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { formData, errors, isSubmitting, handleChange, handleSubmit };
}

// ✅ Component uses the hook
function CheckoutForm() {
  const { formData, errors, handleChange, handleSubmit } = useCheckoutForm(
    async (data) => {
      // submit logic here
    }
  );
  
  return (
    <form onSubmit={handleSubmit}>
      {/* simple, 30-line JSX */}
    </form>
  );
}
```

---

### 6. Safe, Clean JSX (FR-061-FR-068)

#### FR-061: Named Event Handlers (No Inline Handlers)

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - inline event handler
<button onClick={() => handleSubmit()}>Submit</button>
<button onClick={() => setStatus('CONFIRMED')}>Confirm</button>
<input onChange={(e) => setEmail(e.target.value)} />
```

**REQUIRED**:

```typescript
// ✅ CORRECT - named event handler passed by reference
function BookingForm() {
  const handleSubmit = (e: React.FormEvent) => { /* ... */ };
  const handleStatusChange = (status: string) => { /* ... */ };
  
  return (
    <>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={() => handleStatusChange('CONFIRMED')}>
        {/* If you need to pass arguments, use a named handler function */}
        Confirm
      </button>
    </>
  );
}

// ✅ CORRECT - for event handlers that need arguments
function handleStatusClick(status: string) {
  setStatus(status);
}

<button onClick={() => handleStatusClick('CONFIRMED')}>
  Confirm
</button>
```

#### FR-062: No Nested JSX Logic

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - complex logic in JSX
return (
  <div>
    {bookings.map((b) => (
      <div key={b.id}>
        {b.status === 'CONFIRMED' ? (
          <div>
            <h3>{b.service.name}</h3>
            {b.service.description && (
              <p>{b.service.description}</p>
            )}
            {b.remainingBalance > 0 ? (
              <span className="unpaid">${b.remainingBalance}</span>
            ) : (
              <span className="paid">Paid</span>
            )}
          </div>
        ) : b.status === 'PENDING' ? (
          <div>Awaiting payment...</div>
        ) : (
          <div>Cancelled</div>
        )}
      </div>
    ))}
  </div>
);
```

**REQUIRED**:

```typescript
// ✅ CORRECT - extract complex JSX into components
function BookingCard({ booking }: { booking: Booking }) {
  switch (booking.status) {
    case 'CONFIRMED':
      return <ConfirmedBookingCard booking={booking} />;
    case 'PENDING':
      return <PendingBookingCard booking={booking} />;
    case 'CANCELLED':
      return <CancelledBookingCard booking={booking} />;
    default:
      return null;
  }
}

function ConfirmedBookingCard({ booking }: { booking: Booking }) {
  return (
    <div>
      <h3>{booking.service.name}</h3>
      {booking.service.description && (
        <ServiceDescription text={booking.service.description} />
      )}
      <PaymentStatus remainingBalance={booking.remainingBalance} />
    </div>
  );
}

function PaymentStatus({ remainingBalance }: { remainingBalance: number }) {
  return remainingBalance > 0 ? (
    <span className="unpaid">${remainingBalance}</span>
  ) : (
    <span className="paid">Paid</span>
  );
}

// ✅ Usage
return (
  <div>
    {bookings.map((b) => (
      <BookingCard key={b.id} booking={b} />
    ))}
  </div>
);
```

#### FR-063: No `dangerouslySetInnerHTML`

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

**REQUIRED**:

```typescript
// ✅ CORRECT - React escapes by default
<div>{userContent}</div>

// ✅ CORRECT - if HTML rendering needed, use sanitization
import DOMPurify from 'dompurify';

<div>{DOMPurify.sanitize(userContent)}</div>
```

#### FR-064: Explicit TypeScript Props

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - any types on props
function BookingCard(props: any) { /* ... */ }
function ServiceCard({ service }: { service: any }) { /* ... */ }
```

**REQUIRED**:

```typescript
// ✅ CORRECT - explicit TypeScript interfaces
interface BookingCardProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  isLoading?: boolean;
}

function BookingCard({ booking, onCancel, isLoading }: BookingCardProps) {
  /* ... */
}

// ✅ CORRECT - validate external props with Zod
const BookingCardPropsSchema = z.object({
  booking: z.custom<Booking>(),
  onCancel: z.function().optional(),
  isLoading: z.boolean().default(false),
});

function BookingCardWithValidation(props: unknown) {
  const validProps = BookingCardPropsSchema.parse(props);
  return <BookingCard {...validProps} />;
}
```

#### FR-065: No Direct DOM Manipulation

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - direct DOM queries and mutations
function SearchBookings() {
  const handleSearch = () => {
    const results = document.querySelector('#results');
    results.innerHTML = 'Loading...'; // ❌ direct DOM mutation
    
    const input = document.getElementById('search-input') as HTMLInputElement;
    const query = input.value; // ❌ reading from DOM directly
  };
  
  return /* ... */;
}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - React state for all updates
function SearchBookings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await api.searchBookings(searchQuery);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {results.length > 0 && (
        <div id="results">
          {results.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </>
  );
}

// ✅ ALLOWED - useRef for focus management only
function LoginForm() {
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);
  
  return <input ref={emailInputRef} type="email" />;
}
```

#### FR-066: Stable `key` Props for Lists

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - array index as key
{bookings.map((b, index) => (
  <BookingCard key={index} booking={b} /> // ❌ index-based key
))}

// ❌ NOT ALLOWED - missing key on fragments in lists
{bookings.map((b) => (
  <> {/* ❌ Fragment without key in list */}
    <h3>{b.service.name}</h3>
    <p>{formatDate(b.startTime)}</p>
  </>
))}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - unique, stable key
{bookings.map((b) => (
  <BookingCard key={b.id} booking={b} /> // ✅ unique ID as key
))}

// ✅ CORRECT - key on fragments in lists
{bookings.map((b) => (
  <Fragment key={b.id}> {/* ✅ key on Fragment */}
    <h3>{b.service.name}</h3>
    <p>{formatDate(b.startTime)}</p>
  </Fragment>
))}

// ✅ CORRECT - composite key if ID is not unique
{bookings.map((b, i) => (
  <BookingCard
    key={`${b.serviceId}-${b.startTime}`} // ✅ composite stable key
    booking={b}
  />
))}
```

#### FR-067: Explicit Prop Destructuring with Types

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - implicit props object
function ServiceCard(props) {
  return <div>{props.service.name}</div>;
}

// ❌ NOT ALLOWED - missing types on destructured props
function BookingForm({ booking, onSubmit }) {
  return /* ... */;
}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - explicit destructuring with types
interface ServiceCardProps {
  service: Service;
  onSelect?: (serviceId: string) => void;
  isSelected?: boolean;
}

function ServiceCard({ service, onSelect, isSelected = false }: ServiceCardProps) {
  return (
    <button
      onClick={() => onSelect?.(service.id)}
      className={isSelected ? 'selected' : ''}
    >
      {service.name}
    </button>
  );
}

// ✅ CORRECT - validate external props with Zod
function ExternalServiceCard(props: unknown) {
  const validProps = ServiceCardPropsSchema.parse(props);
  return <ServiceCard {...validProps} />;
}
```

#### FR-068: Component Size Limits

**FORBIDDEN**:

```typescript
// ❌ NOT ALLOWED - massive component (>50 lines of JSX)
function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  // ... 20 more state variables ...
  
  return (
    <div>
      <header>...</header>
      <div className="services">
        {services.map(/* large inline rendering */)}
      </div>
      <div className="bookings">
        {bookings.map(/* another large inline rendering */)}
      </div>
      <footer>...</footer>
      {/* 200+ lines of JSX */}
    </div>
  );
}
```

**REQUIRED**:

```typescript
// ✅ CORRECT - decompose into smaller components
function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  useEffect(() => {
    Promise.all([
      api.getServices().then(setServices),
      api.getBookings().then(setBookings),
    ]);
  }, []);
  
  return (
    <div>
      <DashboardHeader />
      <DashboardServices services={services} />
      <DashboardBookings bookings={bookings} />
      <DashboardFooter />
    </div>
  );
}

function DashboardServices({ services }: { services: Service[] }) {
  // 30-50 lines of JSX, focused on services display
  return (
    <section>
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </section>
  );
}

function DashboardBookings({ bookings }: { bookings: Booking[] }) {
  // 30-50 lines of JSX, focused on bookings display
  return (
    <section>
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} />
      ))}
    </section>
  );
}
```

---

## Enforcement

### ESLint Configuration (T017.5, T017.6)

**ESLint rules enforced**:

- `no-var`: Use `const` and `let` only
- `no-console`: No `console.log` in production code
- Custom rule: Forbid `class` keyword
- Custom rule: Forbid `new` operator (with exceptions)
- Custom rule: Forbid `dangerouslySetInnerHTML`
- Custom rule: Forbid inline event handlers in JSX
- TypeScript `no-explicit-any`: Forbid `any` types

### Pre-commit Hook (T017.7)

Git hook runs **before every commit** to validate:

1. No `class` definitions in TypeScript/JSX files
2. No `dangerouslySetInnerHTML` usage
3. No inline arrow functions in JSX props
4. All `.tsx` files use functional components only
5. ESLint passes with 0 errors (0 warnings allowed)

### Code Review Gate (T203.13)

All pull requests MUST include:

```
✅ ESLint Report: 0 functional programming violations
✅ No class-based code detected
✅ All React components are functional
✅ All service functions are pure
✅ All data mutations use immutable patterns
```

---

## Code Style Examples

### Service Functions

```typescript
// lib/services/availability.ts
import { Service, Booking, BusinessHours, DateOverride, SystemSettings } from '@prisma/client';

type TimeSlot = {
  time: string;
  available: boolean;
};

/**
 * Calculate available time slots for a given service and date
 * @param service - Service booking is for
 * @param targetDate - Date to check availability
 * @param bookings - Existing bookings
 * @param businessHours - Operating hours configuration
 * @param dateOverrides - Holiday/closure exceptions
 * @param settings - System settings (buffer time, max bookings)
 * @returns Array of available time slots
 */
export function calculateAvailableSlots(
  service: Service,
  targetDate: Date,
  bookings: Booking[],
  businessHours: BusinessHours[],
  dateOverrides: DateOverride[],
  settings: SystemSettings
): TimeSlot[] {
  // Pure function - no side effects, same input = same output
  const dayOfWeek = targetDate.getDay();
  const hours = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
  
  if (!hours || !hours.isOpen) return [];
  
  const dateOverride = dateOverrides.find((o) =>
    isSameDay(new Date(o.date), targetDate)
  );
  
  if (dateOverride && dateOverride.isBlocked) return [];
  
  const slots = generateTimeSlots(
    hours.openTime,
    hours.closeTime,
    service.durationMin
  );
  
  const bookedSlots = bookings
    .filter((b) => isSameDay(new Date(b.startTime), targetDate))
    .flatMap((b) =>
      getBlockedSlots(b.startTime, b.endTime, settings.bufferMinutes)
    );
  
  const availableSlots = slots.filter(
    (slot) => !bookedSlots.includes(slot)
  );
  
  const bookingCountForDate = bookings.filter((b) =>
    isSameDay(new Date(b.startTime), targetDate)
  ).length;
  
  if (bookingCountForDate >= settings.maxBookingsPerDay) return [];
  
  return availableSlots.map((slot) => ({
    time: formatTime(slot),
    available: true,
  }));
}

// Helper pure functions
function generateTimeSlots(start: string, end: string, durationMin: number): Date[] {
  // implementation
}

function getBlockedSlots(startTime: Date, endTime: Date, bufferMin: number): Date[] {
  // implementation
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
```

### React Component

```typescript
// components/booking/CheckoutForm.tsx
import { useState } from 'react';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import { CheckoutFormData } from '@/types/booking';
import { CheckoutFormSchema } from '@/schemas/checkout';

interface CheckoutFormProps {
  serviceId: string;
  startTime: string;
  downpaymentCents: number;
  onSuccess: (bookingId: string) => void;
  onError: (error: string) => void;
}

/**
 * Checkout form for booking confirmation and payment
 * Collects customer details and initiates Stripe payment
 */
export function CheckoutForm({
  serviceId,
  startTime,
  downpaymentCents,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useCheckoutForm(async (data: CheckoutFormData) => {
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            startTime,
            customerName: data.name,
            customerEmail: data.email,
            customerPhone: data.phone,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create booking');
        }

        const booking = await response.json();
        onSuccess(booking.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        onError(message);
      }
    });

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <fieldset disabled={isSubmitting}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            aria-describedby={errors.name ? 'name-error' : undefined}
            required
          />
          {errors.name && (
            <span id="name-error" className="error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            aria-describedby={errors.email ? 'email-error' : undefined}
            required
          />
          {errors.email && (
            <span id="email-error" className="error">
              {errors.email}
            </span>
          )}
        </div>

        <PaymentAmount cents={downpaymentCents} />

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </fieldset>
    </form>
  );
}

// Extracted sub-component
interface PaymentAmountProps {
  cents: number;
}

function PaymentAmount({ cents }: PaymentAmountProps) {
  const dollars = (cents / 100).toFixed(2);
  return (
    <div className="payment-amount">
      <span>Down Payment Due:</span>
      <span className="amount">${dollars}</span>
    </div>
  );
}
```

### Custom Hook

```typescript
// hooks/useCheckoutForm.ts
import { useState, useCallback } from 'react';
import { CheckoutFormData, CheckoutFormErrors } from '@/types/booking';
import { CheckoutFormSchema } from '@/schemas/checkout';

interface UseCheckoutFormOptions {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
}

/**
 * Hook for managing checkout form state and validation
 * Handles form data, errors, and submission logic
 */
export function useCheckoutForm(
  onSubmit: (data: CheckoutFormData) => Promise<void>
) {
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((): boolean => {
    try {
      CheckoutFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof Error) {
        // Handle validation error - would be Zod error parsing
        setErrors({ general: err.message });
      }
      return false;
    }
  }, [formData]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setErrors({ general: message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit, validate]
  );

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
}
```

---

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Functional Programming in TypeScript](https://www.typescriptlang.org/docs/handbook/)
- [Immutable.js Patterns](https://immerjs.github.io/immer/)
- [Pure Function Principles](https://en.wikipedia.org/wiki/Pure_function)

---

## Questions & Support

For questions about functional programming patterns in this project, consult:

1. This document (FUNCTIONAL_PROGRAMMING_GUIDELINES.md)
2. CODE_STYLE.md (created in T203.14)
3. Existing code in `/components` and `/lib/services`
4. Code review feedback on your pull request
