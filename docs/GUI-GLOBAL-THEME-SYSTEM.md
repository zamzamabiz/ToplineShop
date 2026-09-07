# ToplineShop — Global Enterprise Theme System

> **Status**: IMPLEMENTED  
> **Date**: 2026-09-07  
> **Task**: TOPLINE-GUI-001

## 1. Architecture Overview

The theme system uses a centralized architecture:

```
Theme Registry (6 themes)
    ↓
CSS Variables (data-theme attribute)
    ↓
Shared Layout (AppShell, Sidebar, Topbar)
    ↓
Shared Components (Card, Button, Badge, etc.)
    ↓
Pages / Dashboards
```

## 2. Six Locked Theme Families

| Theme | Type | Description |
|-------|------|-------------|
| **Emerald Night** | Full Dark | Deep green dark theme |
| **Mint Executive** | Full Light | Clean green-tinted light theme |
| **Midnight Shell** | Shell Dark + Light Workspace | Dark sidebar, light content (default) |
| **Ivory Shell** | Shell Light + Dark Workspace | Light sidebar, dark content |
| **Sea Glass** | Cool Professional | Sea-green eye-cool professional |
| **Sage Slate** | Muted Corporate | Muted green/slate corporate |

## 3. Semantic Design Tokens

All colors are defined as CSS custom properties via `data-theme` attribute:

- `--app-canvas` — Page background
- `--app-shell` — Shell/navigation background
- `--surface-primary` — Card/surface background
- `--surface-secondary` — Secondary surface
- `--surface-muted` — Muted surface
- `--border-default` — Default border
- `--text-primary` — Primary text
- `--text-secondary` — Secondary text
- `--text-muted` — Muted text
- `--brand-primary` — Primary brand color
- `--brand-secondary` — Secondary brand color
- `--brand-accent` — Accent color
- `--state-success` — Success state
- `--state-warning` — Warning state
- `--state-danger` — Danger state
- `--state-info` — Info state

## 4. File Structure

```
src/theme/
  theme.types.ts      — ThemeId type, constants
  themeRegistry.ts    — 6 theme definitions with color values
  themeStorage.ts     — localStorage persistence
  ThemeProvider.tsx    — React context provider
  useTheme.ts         — Theme hook
```

## 5. Persistence Model

**Frontend-only persistence (no database):**

- Global: `toplineshop.theme.global` → ThemeId
- Dashboard override: `toplineshop.theme.dashboard.{name}` → ThemeId | "global"

**Preference hierarchy:**
1. Dashboard override
2. Global user preference
3. Platform default (`midnight-shell`)

## 6. Global Theme Switcher

Located in the Topbar. Features:
- Shows current theme name
- Lists all 6 themes with color previews
- Keyboard accessible
- Click outside to close
- Escape to close

## 7. Dashboard Override

Each dashboard can override the global theme:
- Use Global Theme (inherits global selection)
- Or select a specific theme

Override stored per dashboard key.

## 8. Future Architecture (Document Only)

When backend is available:
- `UserPreference` table
- `TenantPreference` table
- `ModulePreference` table

Hierarchy: Dashboard → User → Tenant → Platform default

## 9. Accessibility

- WCAG AA contrast targets for all themes
- Visible keyboard focus states
- No color-only status indicators
- `prefers-reduced-motion` respected
- Fast, calm theme switching

## 10. Extension Rules

To add a new theme:
1. Add ThemeId to `theme.types.ts`
2. Add theme definition to `themeRegistry.ts`
3. Add CSS variables in `globals.css` under `[data-theme="new-theme"]`
4. Add color preview to `ThemeSwitcher.tsx`

## 11. Prohibition

- No page-level hardcoded theme systems
- No duplicated color maps in components
- No dark: prefix usage (use CSS variables instead)
- No direct hex color references in components
