# Data Model: Unified Navigation

## Transient UI State (Navigation Context)

The navigation system relies on transient state derived from the URL and User Session:

### NavSegment (Breadcrumb Entity)

- **label**: `string` (The display name, e.g., "Services")
- **href**: `string` (The target route)
- **current**: `boolean` (Active state indicator)
- **priority**: `number` (Determines truncation behavior on mobile)

### AdminPage (Dropdown Entity)

- **id**: `string` (Route identifier)
- **label**: `string` (Active button text)
- **href**: `string` (The path)
- **icon**: `ComponentType` (Visual indicator)

### MobileMenuState

- **isOpen**: `boolean`
- **iconState**: `"hamburger" | "close"` (Mapped to animation state)

## State Transitions

| Action            | From   | To      | Result                                               |
| ----------------- | ------ | ------- | ---------------------------------------------------- |
| Enter `/book/...` | Any    | Booking | Breadcrumbs render in center; "Home" link active.    |
| Auth as Admin     | Guest  | Admin   | Header shows Admin Dropdown; Customer links removed. |
| Toggle Hamburger  | Closed | Open    | Menu expands; Icon transforms to X.                  |
| Click Section     | Detail | List    | Dropdown text updates to parent section name.        |
