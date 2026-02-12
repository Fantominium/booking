# Contributing

Thanks for contributing to TruFlow.

## Development Setup

1. Install dependencies: `pnpm install`
2. Configure environment variables in `.env.local`
3. Run the dev server: `pnpm dev`

## Code Standards

- Follow [docs/CODE_STYLE.md](docs/CODE_STYLE.md)
- No class components or mutable state updates
- All API input must be validated with Zod
- Avoid inline event handlers in JSX

## Testing

- Unit + integration: `pnpm test`
- E2E: `pnpm test:e2e`

## Pull Requests

- Keep changes scoped
- Include tests for new behavior
- Ensure `pnpm lint` passes
- Attach proof of code style validation (lint output showing 0 functional programming and JSX violations)
- Attach evidence of lint compliance (0 functional/JSX violations)
