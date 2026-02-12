# Feature Specification: Unified Navigation Bar

**Feature Branch**: `001-unified-navigation`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: User description: "menu bar feature - the menu bar that is found on the home page of the site, should persist across all pages of the site, in different forms, depending on the user. The goal of these changes, is to create a singular navigation tool through the menu bar, that users can navigate the entire application through; admin pages are naturally hidden from unauthorised users, and pages specific to the admin are not listed in the nav bar. This feature should be developed in strict adherence to the constitution, and should not deviate from it. The Acceptance criteria for the completed feature is as follows: - For customers, navigation bar should persist across the booking flow - In mobile view, the company name should be on the right of a hamburger menu icon, that when it is not open, it is a hamburger, but when opened, it subtly animates into the close button, which also acts to close the menu, reverting the icon back to the hamburger. - The light and dark mode toggle should sit within the navigation bar only, no other instances of the toggle should be available or shown on the page. - A higher contrast is needed for the dark mode toggle, as it is not visible enough when the site is in dark mode. - On the home page, and the nav bar in general, the “Book Appointment” and “Admin” button are removed. - As a customer begins the booking flow, a breadcrumb component appears in the middle of the nav bar, replacing the “book appointment” and “Admin” button. Pay close attention to use a solution for this that is mobile friendly first, and most practical for both mobile and desktop. - For a user to return to the homepage, they can click on the website logo in the nav bar, use the breadcrumbs or in the hamburger menu, clicking on the “Home” menu item. - The “Admin Dashboard” button on the homepage is removed completely. - The admin page should not be listed anywhere on the customer pages, nor in the nav bar for customers. - To log in to the admin dashboard, the user must navigate to the /admin subdomain. When the user navigates to /admin , the user must enter the admin username and password, and must be authenticated first, before the admin page is shown, at all times. Never show the admin pages without the user authenticating as an admin first. - Note the admin credentials to me when the tasks are finished. - In the admin panel, the “dashboard, services, bookings and availability” should have the admin navigation panel persist across all of those pages. - Those pages should be accessible from a button that acts as a drop down list, instead of the items spread horizontally in the container beneath the nav bar. - This button drop down menu, should show the current page on the button menu text, with a small down arrow to the right, indicating it is a drop down selection, and the button text updates when the page is changed from dashboard, to bookings, services etc. - The breadcrumb component is not needed for the admin page."

## Clarifications

### Session 2026-02-12

- Q: Admin panel hosting strategy (Subdomain vs Subpath)? → A: Option B (Subpath: `/admin`).
- Q: Mobile breadcrumb pattern for small viewports? → A: Option A (Truncation: Home > ... > Current).
- Q: Admin dropdown text for sub-pages/details? → A: Option A (Always show Main Section name).
- Q: Navigation Bar Logo format? → A: Option C (Combination: Graphic logo (attached) + "TruFlow" company name).
- Q: Admin login discoverability? → A: Option B (Path only: Manual URL entry to `/admin`).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Seamless Customer Journey (Priority: P1)

As a customer, I want a persistent navigation experience that tracks my progress during booking so that I never feel lost and can easily return home or switch themes.

**Why this priority**: Core "happy path" value as per project vision; ensures reliability and simplicity in the primary user flow.

**Independent Test**: Start a booking, verify the breadcrumbs appear in the nav bar, and use the logo to return home. Verify "Admin" and "Book Appointment" buttons are absent.

**Acceptance Scenarios**:

1. **Given** a customer is on the home page, **When** they look at the navigation bar, **Then** they see the website logo, a theme toggle, and no "Admin" or "Book Appointment" buttons.
2. **Given** a customer starts the booking flow, **When** they navigate through steps, **Then** a mobile-friendly breadcrumb component appears in the center of the navigation bar.
3. **Given** a customer is at any step of the booking flow, **When** they click the website logo, **Then** they are returned to the home page and breadcrumbs disappear.

---

### User Story 2 - Secure Admin Access & Navigation (Priority: P2)

As an admin, I want to manage my business through a secure, exclusive interface that doesn't leak into the customer experience.

**Why this priority**: Critical for business operations and security; separates administrative control from customer convenience.

**Independent Test**: Navigate to `/admin`, verify the authentication challenge, and after login, use the dropdown menu to switch between "Bookings" and "Services".

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they attempt to access `/admin`, **Then** they are presented with a login screen and no admin content is visible.
2. **Given** an authenticated admin, **When** they click the navigation dropdown, **Then** a list of pages (Dashboard, Services, Bookings, Availability) appears.
3. **Given** an admin selects "Services" from the dropdown, **When** the page loads, **Then** the dropdown button text updates to "Services" with a visible down arrow.

---

### User Story 3 - Accessible Global Controls (Priority: P2)

As any user, I want to adjust the site's theme from the navigation bar so that I can see the controls clearly regardless of the current mode.

**Why this priority**: Required for WCAG 2.2 AA compliance and inclusive UX.

**Independent Test**: Toggle the theme from Light to Dark, verify the toggle icon visibility/contrast remains high, and check for any redundant toggles on the page.

**Acceptance Scenarios**:

1. **Given** the site is in Dark Mode, **When** the user views the theme toggle, **Then** the icon contrast meets a minimum ratio of 4.5:1 against the navigation bar background.
2. **Given** any page in the application, **When** the user looks for theme controls, **Then** exactly one toggle is visible, located exclusively within the navigation bar.

---

### User Story 4 - Delightful Mobile Interaction (Priority: P3)

As a mobile user, I want a clear and responsive navigation menu that uses standard patterns like the hamburger icon.

**Why this priority**: Enhances UX on mobile devices and meets modern interaction standards.

**Independent Test**: Open the site on a mobile viewport, tap the hamburger menu, verify it animates into a close button, and select "Home" from the menu.

**Acceptance Scenarios**:

1. **Given** a mobile screen size, **When** the navigation bar renders, **Then** the company name is on the right and a hamburger icon is on the left.
2. **Given** the mobile menu is closed, **When** the user taps the hamburger, **Then** it morphs into a close icon and the menu expands.
3. **Given** the mobile menu is open, **When** the user taps the close icon, **Then** the menu collapses and the icon reverts to a hamburger.

### Edge Cases

- **Unauthorized Access**: If a user bookmarks an internal admin page (e.g., `/admin/services`) and their session is expired, the system MUST redirect to the login screen without displaying any cached data.
- **Orientation Switch**: When a mobile user rotates from portrait to landscape (transitioning from mobile to tablet-like view), the navigation bar MUST adapt its layout without losing the current breadcrumb state.
- **Empty Breadcrumbs**: If the user is on a page that is neither the home page nor part of the booking flow (e.g., a "Terms of Service" page), the breadcrumb area MUST remain empty or show a basic "Home" link.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: **Global Persistence**: The navigation bar MUST be present on every page of the application.
- **FR-002**: **Identity Protection**: Admin-specific navigation links MUST NOT be rendered for non-authenticated or customer roles. No visible links to the admin login (e.g., in footers or menus) shall exist for customers; access is via manual URL entry to the `/admin` path.
- **FR-003**: **Contextual Breadcrumbs**: The navigation bar MUST display a breadcrumb component ONLY when a user enters the `/book` path.
- **FR-004**: **Mobile-First Breadcrumbs**: Breadcrumbs MUST use a truncation pattern on screens as narrow as 320px, showing only the root and the current step (e.g., Home > ... > Step 3).
- **FR-005**: **Authenticated Admin Root**: Access to any path starting with the `/admin` subpath MUST be gated by a mandatory authentication check.
- **FR-006**: **Admin Page Selector**: Admin navigation MUST be consolidated into a single dropdown button that displays the top-level section name (e.g., "Services") even when viewing sub-pages or details.
- **FR-007**: **Theme Toggle Uniqueness**: The application MUST NOT render any theme or light/dark mode toggles outside of the navigation bar.
- **FR-008**: **High Contrast Toggle**: The theme toggle MUST maintain a contrast ratio of at least 4.5:1 against its background in both light and dark modes.
- **FR-009**: **Homepage Cleanup**: All instances of "Book Appointment", "Admin", and "Admin Dashboard" buttons MUST be removed from the home page body and standard navigation links.
- **FR-010**: **Logo Navigation**: The website logo (TruFlow graphic + "TruFlow" text) in the navigation bar MUST function as a link to the root directory (`/`).
- **FR-011**: **Animated Mobile Icon**: The hamburger icon MUST use a smooth visual animation to transition to a close icon (`X`) when active.

### Key Entities _(include if feature involves data)_

- **Navigation Context**: A transient state representing the current user's role (Guest, Admin) and the current page's position in a hierarchy (Home -> Step 1 -> Step 2).
- **Admin Session**: A secure authenticated state that verifies the user has permission to view `/admin` routes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of admin routes (/admin/\*) are inaccessible to unauthenticated users, redirecting to a login page.
- **SC-002**: Navigation bar height remains consistent (+/- 5px) between mobile and desktop views to maintain layout stability.
- **SC-003**: Users can return home from the 3rd step of the booking flow via 3 different methods: Logo, Breadcrumbs, or Mobile Menu.
- **SC-004**: Theme toggle is discoverable within 3 seconds for new users (verified by user testing).
- **SC-005**: Accessibility audit for navigation bar color contrast achieves a perfect score using standard verification tools.

## Assumptions & Dependencies

- **Authentication System**: Assumes a functioning authentication system exists that can handle `/admin` path protection.
- **Logo Asset**: Assumes a website logo asset is available for inclusion in the navigation bar.
- **Routing**: Assumes the application's router can handle dynamic breadcrumb generation based on URL segments.

## Definition of Done _(mandatory)_

All items below MUST be satisfied for completion:

- Storybook stories exist for all applicable UI components.
- OpenAPI coverage includes every API endpoint in `spec/openapi.yaml`.
- Unit, integration, and E2E tests are implemented with required coverage and pass.
- Linting reports zero errors.
- Accessibility audits achieve Lighthouse Accessibility score ≥ 95 and manual WCAG 2.2 AA checks.
- Documentation is updated (README, docs/, specs, API contracts as applicable).
