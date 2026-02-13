# Tasks: Unified Navigation Bar

**Input**: Design documents from `/specs/001-unified-navigation/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md)

**Tests**: Tests are REQUIRED by the constitution. All tasks follow TDD: Tests (Red) -> Implementation (Green) -> Refactor (Clean).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Phase 1: Setup

**Purpose**: Initial configuration and cleanup.

- [ ] T001 [P] Add TruFlow logo asset to `public/logo.png` (from user attachment)
- [ ] T002 [P] Configure Storybook globals for theme and viewport testing in `.storybook/preview.ts`
- [ ] T003 [P] Add Lucide React dependency to `package.json` for standardized navigation icons

## Phase 2: Foundational

**Purpose**: Shared utilities and core layout structure changes.

- [ ] T004 Define `useBreadcrumbs` hook signature and logic in `src/lib/nav/useBreadcrumbs.ts`
- [ ] T005 [P] Implement `NavigationContext` providers if needed or verify path-based derivation logic in `src/components/navigation/Header.tsx`
- [ ] T006 [P] Update `tailwind.config.ts` with accessibility-compliant high-contrast color tokens for Dark Mode

---

## Phase 3: User Story 1 - Seamless Customer Journey (Priority: P1) 🎯 MVP

**Goal**: Persistent nav with breadcrumbs during booking and home cleanup.

**Independent Test**: Start booking at `/book`, verify breadcrumbs appear; click logo to return home and verify breadcrumbs disappear and buttons (Admin/Book) are gone.

### Tests for User Story 1 (REQUIRED)

- [ ] T007 [P] [US1] Create unit tests for path-to-breadcrumb mapping in `tests/unit/nav/useBreadcrumbs.test.ts`
- [ ] T008 [P] [US1] Create integration test for Header state transitions (Guest -> Booking) in `tests/integration/components/Header.test.tsx`
- [ ] T009 [US1] Create E2E test for home page cleanup and booking flow navigation in `tests/e2e/navigation/customer-flow.spec.ts`

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create `Breadcrumbs` component in `src/components/booking/Breadcrumbs.tsx`
- [ ] T011 [US1] Refactor `src/components/Header.tsx` to remove "Book Appointment" and "Admin" buttons and conditionally render `Breadcrumbs`
- [ ] T012 [US1] Implement Logo-to-Home link logic in `src/components/Header.tsx` with TruFlow graphic and text
- [ ] T013 [US1] Create Storybook stories for Customer Header states in `src/stories/navigation/Header.stories.tsx`

---

## Phase 4: User Story 3 - Accessible Global Controls (Priority: P2)

**Goal**: Centralized high-contrast theme toggle.

**Independent Test**: Verify exactly one theme toggle exists on any page (in nav) and passes 4.5:1 contrast in dark mode.

### Tests for User Story 3 (REQUIRED)

- [ ] T014 [P] [US3] Create accessibility unit test for `ThemeToggle` contrast in `tests/unit/components/ThemeToggle.test.tsx`
- [ ] T015 [US3] Create E2E test for global toggle uniqueness and functionality in `tests/e2e/navigation/theme-toggle.spec.ts`

### Implementation for User Story 3

- [ ] T016 [P] [US3] Enhance `ThemeToggle` component in `src/components/ThemeToggle.tsx` with high-contrast SVG/CSS per Research R-003
- [ ] T017 [US3] Remove all other instances of theme toggles from pages (e.g., `src/app/page.tsx` or layout bodies)
- [ ] T018 [US3] Ensure `ThemeToggle` is correctly positioned in the refactored `Header.tsx`

---

## Phase 5: User Story 4 - Delightful Mobile Interaction (Priority: P3)

**Goal**: Animated hamburger menu with specific mobile layout.

**Independent Test**: On mobile viewport, verify Logo/Name right-alignment and hamburger morphing animation on tap.

### Tests for User Story 4 (REQUIRED)

- [ ] T019 [P] [US4] Create visual regression tests for hamburger animation in `tests/e2e/navigation/hamburger-animation.spec.ts`
- [ ] T020 [US4] Create mobile-specific layout integration tests in `tests/integration/components/Header.mobile.test.tsx`

### Implementation for User Story 4

- [ ] T021 [P] [US4] Create animated `HamburgerIcon` component in `src/components/navigation/HamburgerIcon.tsx` using Tailwind 4 morphing
- [ ] T022 [US4] Implement mobile-responsive `Header` layout in `src/components/Header.tsx` (Logo right, Hamburger left)
- [ ] T023 [US4] Implement truncation logic in `Breadcrumbs.tsx` for 320px viewports (Home > ... > Current)
- [ ] T024 [US4] Create Storybook stories for Mobile Header states in `src/stories/navigation/Header.mobile.stories.tsx`

---

## Phase 6: User Story 2 - Secure Admin Access & Navigation (Priority: P2)

**Goal**: Secure admin dropdown and path protection.

**Independent Test**: Login to `/admin`, verify dropdown button updates text to "Services" (etc.) and contains "Dashboard, Services, Bookings, Availability".

### Tests for User Story 2 (REQUIRED)

- [ ] T025 [P] [US2] Create security integration test for `/admin` subpath redirection in `tests/integration/auth/admin-gate.test.ts`
- [ ] T026 [P] [US2] Create unit tests for admin dropdown state mapping in `tests/unit/nav/AdminDropdown.test.tsx`
- [ ] T027 [US2] Create E2E test for Admin navigation flow and dropdown updates in `tests/e2e/navigation/admin-flow.spec.ts`

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create `AdminDropdown` component in `src/components/navigation/AdminDropdown.tsx` (button + arrow)
- [ ] T029 [US2] Update `Header.tsx` to render `AdminDropdown` ONLY for authenticated admin sessions
- [ ] T030 [US2] Implement "Identity Protection" by ensuring NO admin links are rendered in guest sessions in `src/components/Header.tsx`
- [ ] T031 [US2] Create Storybook stories for Admin Header states in `src/stories/navigation/Header.admin.stories.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final audit and documentation.

- [ ] T032 [P] Conduct full Lighthouse Accessibility audit targeting ≥ 95 score
- [ ] T033 [P] Perform manual WCAG 2.2 AA check for keyboard navigation in navigation elements
- [ ] T034 Update `docs/PHASE_8_NAVIGATION.md` with implementation summary
- [ ] T035 Verify zero linting errors across all modified files
- [ ] T036 Document admin credentials (for testing) in `specs/001-unified-navigation/quickstart.md`
- [ ] T037 [US1] Verify layout stability (SC-002) via unit/E2E tests (nav bar height consistency +/- 5px)
- [ ] T038 [US3] Perform manual usability check for theme toggle discoverability (SC-004)

## Dependency Graph

```text
Setup (Ph1) -> Foundational (Ph2)
                      |
        -----------------------------
        |           |               |
      US1 (P1) -> US3 (P2) -> US4 (P3)
        |           |
        ---- US2 (P2) -----
                    |
              Polish (Final)
```

## Implementation Strategy

- **MVP First**: Start with US1 (Customer Journey) to clean up the home page and establish the basic `Header` refactor.
- **TDD Requirement**: Every implementation task (T010+) requires the corresponding test tasks (T007+) to be green before completion.
- **Parallel Work**: US3 (Theme) and US2 (Admin) can be developed in parallel once Step 2 (Foundation) is complete, as they touch different sub-components.
