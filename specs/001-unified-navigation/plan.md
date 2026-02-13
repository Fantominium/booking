# Implementation Plan: Unified Navigation Bar

**Branch**: `001-unified-navigation` | **Date**: 2026-02-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-unified-navigation/spec.md`

## Summary

This feature implements a context-aware, persistent unified navigation system for the TruFlow Booking application. The solution refactors the existing `Header` into a dynamic component that adapts based on the user's journey (Customer vs. Admin) and location (Home, Booking steps, Admin management). Key technical focus includes a mobile-first animated interaction pattern and strict accessibility conformance (WCAG 2.2 AA).

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x  
**Primary Dependencies**: Next.js 16.x, Tailwind CSS v4, Lucide React (for icons), Next-Auth v4  
**Storage**: N/A (Transient UI state)  
**Testing**: Vitest (Unit), Playwright (E2E), Storybook (Visual)  
**Target Platform**: Web (Mobile-First responsive)
**Project Type**: Next.js Web Application  
**Performance Goals**: < 100ms CLS (Cumulative Layout Shift) during navigation context transitions.  
**Constraints**: Zero "Admin" visible surface area for guest users; high-contrast contrast theme toggles.  
**Scale/Scope**: ~3-4 new/refactored components, 1 integrated Header system.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Required gates (Definition of Done alignment):

- [x] Storybook stories planned for all applicable UI components (`Header`, `Breadcrumbs`, `AdminDropdown`, `HamburgerIcon`).
- [x] OpenAPI coverage planned for every API endpoint (N/A - UI only, but verify `/admin` auth).
- [x] Unit, integration, and E2E tests planned with coverage expectations.
- [x] Linting must pass with zero errors.
- [x] Accessibility audits planned with target Lighthouse Accessibility score ≥ 95 and manual WCAG 2.2 AA checks.
- [x] Documentation updates identified (README, docs/, specs, API contracts).

## Project Structure

### Documentation (this feature)

```text
specs/001-unified-navigation/
├── plan.md              # This file
├── research.md          # Visual transitions and breadcrumb logic
├── data-model.md        # Navigation context and step hierarchy
├── quickstart.md        # Setup and testing instructions
├── contracts/           # N/A (no new API endpoints)
└── tasks.md             # Generated from plan
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (customer)/
│   └── admin/          # Strictly protected via middleware
├── components/
│   ├── booking/
│   │   └── Breadcrumbs.tsx
│   ├── navigation/
│   │   ├── AdminDropdown.tsx
│   │   ├── HamburgerMenu.tsx
│   │   └── Header.tsx   # Refactored
│   └── ThemeToggle.tsx  # Enhanced contrast
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
