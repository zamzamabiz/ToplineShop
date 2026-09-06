# ToplineShop Design System

## Purpose

Central design tokens and status helpers for the ToplineShop frontend.

## Files

- `tokens.ts` — Spacing, radii, shadows, typography, status colors, phase labels
- `status.ts` — Reusable status badge/pill components
- `navigation.ts` — Navigation structure definitions

## Usage

```tsx
import { StatusPill } from "@/design-system/status";
import { spacing, radii, statusColors } from "@/design-system/tokens";
```

## Rules

- No external theming library
- No shadcn/ui installed yet (Phase 1)
- No heavy component library
- Simple, reusable, TypeScript-only
