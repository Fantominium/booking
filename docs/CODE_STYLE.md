# TruFlow Code Style Guide

## Goals

- Functional programming first: no classes, no `this` bindings
- Predictable state: immutable updates only
- Safe JSX: no inline handlers, no `dangerouslySetInnerHTML`
- Explicit typing: no `any`, props typed, Zod at boundaries

## Functional Patterns

### ✅ Use pure functions

```ts
const calculateTotal = (items: ReadonlyArray<{ price: number }>): number =>
  items.reduce((total, item) => total + item.price, 0);
```

### ❌ Avoid side effects in shared utilities

```ts
// Avoid
let total = 0;
export const add = (value: number) => (total += value);
```

## Immutability

### ✅ Prefer immutable transforms

```ts
const updated = items.map((item) => ({ ...item, status: "ACTIVE" }));
```

### ❌ Avoid mutating arrays or objects

```ts
// Avoid
items.push(newItem);
item.status = "ACTIVE";
```

## React Components

### ✅ Functional components only

```tsx
export const Header = ({ title }: { title: string }): JSX.Element => <h1>{title}</h1>;
```

### ❌ Class components

```tsx
// Avoid
class Header extends React.Component {
  /* ... */
}
```

## JSX Event Handlers

### ✅ Use memoized handlers

```tsx
const handleClick = useCallback(() => {
  onAction();
}, [onAction]);

return <button onClick={handleClick}>Save</button>;
```

### ❌ Inline lambdas in JSX

```tsx
// Avoid
<button onClick={() => onAction()}>Save</button>
```

## Unsafe HTML

- `dangerouslySetInnerHTML` is forbidden.
- Prefer structured content or sanitized renderers.

## Typing & Validation

- Props must be explicitly typed.
- API inputs must be validated with Zod schemas.

## ESLint Configuration

- See [eslint.config.mjs](../eslint.config.mjs) for enforced rules.
