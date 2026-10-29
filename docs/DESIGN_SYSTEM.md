# Novelora Design System

> Neo-Brutalist · Comic Book · Bold · Clean · Readable

---

## Philosophy

Novelora's design feels like a **printed comic book page** — flat, bold, high-contrast, and tidy. NOT chaotic or neon. Lots of whitespace, clear hierarchy, and just enough comic flair to be fun.

Rule: **max 2 accent colors per section**. White is the dominant background. Aurora Blue is the main brand color.

---

## Color Tokens

### New Palette: White Base + Northern Lights Shades

| Token | Hex | Usage |
|-------|-----|-------|
| `white` / `--color-paper` | `#FFFFFF` | Pure White (main page background) |
| `frost` / `--color-frost` | `#F2F8FD` | Alternate section backgrounds, cards sitting on white, input fills |
| `ink` / `--color-ink` | `#0B1D33` | Midnight Ink (text, borders, hard shadows, marquee and footer background) |
| `aurora-blue` / `--color-aurora-blue` | `#8EC9F5` | PRIMARY: logo box, main buttons, section caption boxes, hero tag strip, hero book card, active nav underline |
| `aurora-mint` / `--color-aurora-mint` | `#7EE3C9` | Success, "Completed" badge, saved state, marquee star separators, underline bars |
| `aurora-lavender` / `--color-aurora-lavender` | `#B9A7F5` | Secondary accent: "POPULAR"/"NEW!" badges, hover states, stacked cards behind the hero book |
| `deep-sky` / `--color-deep-sky` | `#2E6FDB` | Links, selected states, focus outlines, hero word "NOVELORA.", "Read Chapter 1 Free" text |
| `aurora-pink` / `--color-aurora-pink` | `#F5B8E0` | Rare, tiny tags only |
| `soft-coral` / `--color-soft-coral` | `#FF7A8A` | Delete/danger only |
| `slate-grey` / `--color-muted` | `#4A5B70` | Secondary text |

### Reader Dark Theme ("Night Sky")

| Token | Hex | Usage |
|-------|-----|-------|
| `--dark-bg` | `#0B1424` | Reader dark background |
| `--dark-card` | `#14223A` | Reader dark card |
| `--dark-text` | `#E6F1FF` | Reader dark text |
| `--dark-border` | `#E6F1FF` | Reader dark borders |

---

## Typography

### Fonts

```
Headings, logo, buttons: "Bangers" — uppercase, letter-spacing: 1px
UI and body:             "Space Grotesk" — weights 300-700
Reading text:            "Literata" — serif, 18px, line-height 1.8
```

> **Never use Bangers for long reading paragraphs.**

### Type Scale

| Level | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| Display | Bangers | 4-8rem | 400 | Hero headline |
| H1 | Bangers | 2.5-4rem | 400 | Page titles |
| H2 | Bangers | 2rem | 400 | Section titles |
| H3 | Bangers | 1.5rem | 400 | Card titles |
| Body | Space Grotesk | 1rem | 400 | UI text |
| Small | Space Grotesk | 0.875rem | 400 | Labels, captions |
| Reading | Literata | 1.125rem (18px) | 400 | Chapter content |

---

## Borders, Shadows & Shapes

```css
/* Standard border */
border: 3px solid #0B1D33;

/* Hard offset shadows (NO blur) */
box-shadow: 6px 6px 0 #0B1D33;   /* Cards */
box-shadow: 4px 4px 0 #0B1D33;   /* Buttons */
box-shadow: 8px 8px 0 #0B1D33;   /* Hover state */

/* Border radius */
border-radius: 0 to 6px;  /* Mostly 0-4px */

/* Hover state */
transform: translate(-2px, -2px);
box-shadow: 8px 8px 0 #0B1D33;

/* Pressed state */
transform: translate(4px, 4px);
box-shadow: none;
```

---

## Component Patterns

### Buttons

| Variant | Background | Text | Border | Shadow |
|---------|-----------|------|--------|--------|
| Primary | `#8EC9F5` (Aurora Blue) | `#0B1D33` | 3px ink | 4px hard |
| Secondary | `#FFFFFF` | `#0B1D33` | 3px ink | 4px hard |
| Danger | `#FF7A8A` (Soft Coral) | `#0B1D33` | 3px ink | 4px hard |
| Ghost | transparent | `#0B1D33` | 3px ink (hover) | none |

All buttons: Bangers font, uppercase, `letter-spacing: 1px`.

### Cards

- White background (or Frost `#F2F8FD` where a card sits directly on a white background)
- 3px solid `#0B1D33` border
- `6px 6px 0 #0B1D33` shadow
- Hover: lifts with `translate(-2px, -2px)` + `8px 8px 0` shadow

### Inputs & Textareas

- Frost background `#F2F8FD`
- 3px solid `#0B1D33` border
- Focus: `outline: 3px solid #2E6FDB; outline-offset: 2px`
- Space Grotesk font

### Badges

| Variant | Background | Text |
|---------|-----------|------|
| Aurora Blue (Draft/Default) | `#8EC9F5` | `#0B1D33` |
| Aurora Mint (Published/Completed) | `#7EE3C9` | `#0B1D33` |
| Aurora Lavender (Ongoing/New/Popular) | `#B9A7F5` | `#0B1D33` |
| Deep Sky (Genre/Info) | `#2E6FDB` | `#FFFFFF` |
| Aurora Pink (Rare/Small) | `#F5B8E0` | `#0B1D33` |

---

## Comic Touches

### Halftone Pattern (Hero Only)

```css
.halftone {
  background-image: radial-gradient(circle, #8EC9F5 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.08;
}
```

### Speech Bubbles

White or Frost background, 3px ink border, tail pointing in specified direction. Used for:
- Author bio
- Welcome messages on login/signup
- Tips and empty states

### Panel Grid

Comic panel grid layouts with varied sizes — used on landing page and library. Thick borders between panels.

### Section Titles (Caption Boxes)

```html
<div class="bg-aurora-blue border-3 border-ink px-4 py-1 inline-block shadow-hard-sm">
  <h2 class="font-bangers text-2xl uppercase tracking-comic text-ink">SECTION TITLE</h2>
</div>
```

### Marquee Strip

Midnight Ink (`#0B1D33`) background, white uppercase text, Aurora Mint separators, continuous CSS animation scrolling left.

---

## Layout

- **Reading column**: max-width 680px, centered
- **Card grid**: CSS grid with gap equal to border width
- **Mobile first**: base styles mobile, breakpoints for larger screens
- **Tap targets**: minimum 44px × 44px

---

## Animation Rules

- **Hover**: `transform translate(-2px, -2px)` + shadow grow — `transition: 150ms ease`
- **Press**: `translate(4px, 4px)` + shadow disappear
- **Page transitions**: subtle fade-in only
- **No parallax**, no heavy motion
- **Loading skeletons**: shimmer with neo-brutalist border

---

## Reusable Components

Located in `frontend/src/components/ui/`:

- `Button` — primary / secondary / danger / ghost variants
- `Card` — standard container
- `Badge` — small status pills
- `Chip` — selectable genre/tag chips
- `Input` — styled text input
- `Textarea` — multi-line input
- `Select` — dropdown
- `Modal` — overlay dialog
- `Toast` — react-hot-toast wrapper
- `Tabs` — tab navigation
- `SpeechBubble` — comic speech bubble
- `Panel` — comic panel with optional title
- `Marquee` — auto-scrolling strip
- `ProgressBar` — thin horizontal bar
- `Skeleton` — loading placeholder

---

## Logo

```
NOVELORA
```

- Font: Bangers, uppercase
- Color: Midnight Ink `#0B1D33`
- Container: Aurora Blue `#8EC9F5` background, 3px ink border, `4px 4px 0 #0B1D33` shadow
- Favicon: Letter "N" in same style

---

## Favicon

SVG favicon with "N" in Bangers font on Aurora Blue `#8EC9F5` background, 3px ink border.
