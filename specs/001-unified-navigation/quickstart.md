# Quickstart: Unified Navigation

## Development Setup

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```
2. **Launch Storybook** (Recommended for UI work):

   ```bash
   pnpm storybook
   ```

   - Navigate to `Navigation/Header` to see various states (Guest, Booking, Admin).

3. **Running the App**:
   ```bash
   pnpm dev
   ```

## Testing Scenarios

### 1. Customer Breadcrumbs

- Navigate to `/book`.
- Verify the breadcrumbs appear in the header.
- Resize viewport to 320px; verify intermediate steps disappear according to truncation rules.

### 2. Admin Authentication

- Attempt to navigate to `/admin`.
- Verify redirect to `/admin/login` (Unauthorized state).
- Log in with **test admin credentials**:
- **Email**: `admin@truflow.local`
- **Password**: `TestPassword123!`
  - _(Note: These credentials should be seeded via `prisma/seed.ts` for testing purposes)_
- Verify the horizontal links are replaced by the Admin Dropdown button.
- Test dropdown navigation: Dashboard, Services, Bookings, Availability.

**Creating Test Admin** (if not seeded):

```bash
# Run Prisma seed script
npx prisma db seed

# Or manually create admin via Prisma Studio
npx prisma studio
# Navigate to Admin table and create entry with hashed password
```

### 3. Theme Contrast

- Toggle to Dark Mode.
- Use dev tools to check contrast of the `ThemeToggle` icon. Target ratio: **4.5:1**.

### 4. Mobile Animation

- In mobile Safari/Chrome emulator, click the hamburger.
- Observe the morphing animation to an "X".
