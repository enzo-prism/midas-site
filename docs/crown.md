# Crown brand mark

The header, app-preview, and footer crowns are `span.pixel-crown` elements in
`index.html`, each containing an inline SVG (gold gradient + gem dot) with
CSS-only motion in `src/style.css`. No JavaScript drives the crown.

## Shape

The SVG path reuses the original pixel-crown silhouette on a `0 0 25 22`
viewBox (three teeth + base bar). The wrapping span keeps the original box so
layouts never shift: 25x22 everywhere, 16x14 inside `.preview-brand` via the
existing `.preview-brand .pixel-crown` rule. Each inline SVG uses its own
gradient id (`crown-gold-h`, `crown-gold-p`, `crown-gold-f`) because IDs must
be unique per document.

## Color

Four-stop diagonal gold, identical in light and dark themes:

| Stop | Hex     |
|------|---------|
| 0    | #FFF6D5 |
| .38  | #F1D67A |
| .72  | #C9A227 |
| 1    | #8A6D1B |

Gem dot: `#FFF6D8` at (12.5, 12), r=1.6.

## Motion

All motion is CSS `transform` / `filter` / `opacity` only (compositor-friendly),
with `isolation: isolate` containing paint:

| Layer          | Animation    | Timing                                       |
|----------------|--------------|----------------------------------------------|
| Entrance       | `crown-enter`| 900ms `cubic-bezier(.22,1,.36,1)`, once      |
| Idle float     | `crown-float`| 4500ms `cubic-bezier(.37,0,.63,1)`, infinite |
| Breathing glow | `crown-glow` | 3200ms ease-in-out, infinite (offset phase)  |
| Sheen sweep    | `crown-shine`| 4500ms `cubic-bezier(.65,0,.35,1)`, 55% dwell|
| Star twinkle   | `crown-twinkle` | 4500ms ease-in-out, 1.1s delay, one spark  |
| Hover lift     | transition   | 260ms `cubic-bezier(.22,1,.36,1)` on `.brand:hover` |

Float (4.5s) and glow (3.2s) use staggered periods so they never sync. The
sheen rests 55% of each cycle so the flash stays elegant, not gaudy.

## Reduced motion

Under `prefers-reduced-motion: reduce`, all crown animation is removed and the
mark renders as a static gold gradient (pseudo-element layers hidden). The
pre-existing global kill-switch in `style.css` is kept; the crown-specific
rule guarantees the static fallback (opacity 1, no transform).

## Do not confuse with the hero art

`canvas#ascii-crown` (`src/ascii-crown.ts`, covered by `tests/site.spec.ts`)
is a separate decorative system. Keep the two apart: the brand mark is the
only crown that shimmers, so the hero animation never competes with it.
