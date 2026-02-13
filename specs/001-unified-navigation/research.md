# Research: Unified Navigation Bar

## R-001: Mobile Hamburger Animation (Tailwind 4)

**Decision**: Use a pure Tailwind/CSS approach with state-driven classes to morph three spans into an "X".

**Rationale**: Minimizes dependencies (avoids complex animation libraries like Framer Motion for a simple UI interaction) and ensures peak performance on mobile.

**Alternatives Considered**:

- Framer Motion: Overkill for a single icon transition.
- SVGR with custom paths: More complex to maintain than standard CSS grouping.

## R-002: Mobile Breadcrumb Truncation Logic

**Decision**: Implement a custom `useBreadcrumbs` hook that maps the current path to segments and applies a truncation rule: `Home > ... > [Current]`.

**Rationale**: Standard libraries (like `@mui/material`) bring significant weight. A custom Tailwind-based component gives full design control over the "middle" text and mobile responsiveness.

**Alternatives Considered**:

- Horizontal scroll: Rejected per user clarification (Option A selected).
- Parent-only back button: Rejected per user clarification (Option A selected).

## R-003: High-Contrast Dark Mode Toggle

**Decision**: Upgrade the `ThemeToggle` button styles to use specific high-contrast color tokens in dark mode (`text-amber-400` or similar for sun, `text-blue-200` for moon) ensuring a 4.5:1 ratio against the surface background.

**Rationale**: Directly addresses FR-008 and ensures accessibility compliance.

## R-004: Admin Dropdown Button Text

**Decision**: Use a State-driven selection that identifies the top-level parent route (e.g., `/admin/services/*` maps to "Services").

**Rationale**: Ensures consistency as per user clarification Session 2026-02-12.
