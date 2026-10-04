# DIRECTIVE 007: HORIZONTAL PORTRAIT CAROUSEL STYLESHEET

## 1. TARGET FILE
- `css/dungeon-creation-carousel.css` (Create and populate this asset file exclusively)

## 2. STRUCTURAL MANDATES & VIEWPORT CELL CONSTRAINTS
- **The Pixelated Graphic Filter Rule:** To protect your vintage retro visual aesthetic, all portraits rendered inside the carousel container must enforce crisp, hardware-independent pixelated scaling rendering filters:
  `image-rendering: pixelated; image-rendering: crisp-edges;`
- **The Carousel Masking Flex Grid Wrapper:** The master container framework (`#portrait-rolodex-viewport`) must implement a strict horizontal row layout using absolute position constraints bounding width fields securely:
  `display: flex; align-items: center; justify-content: center; overflow: hidden;`
- **The Circular Horizontal Array Wrapping Logic:** Image indices must map to position center vertex calculations natively using an alphanumeric sorting left-to-right matrix pass:
  * **Center Focused Portrait:** Drawn full size at 100% scale factor, full lighting opacity (`opacity: 1;`), and an active pulsing visual outline highlight ring.
  * **Left Clipped Portrait (Index N-1):** Bounded to a deflated 75% scale factor, a dim 30% alpha transparency fade (`opacity: 0.3;`), and partially clipped against the left boundary margin row.
  * **Right Floating Portrait (Index 1):** Bounded to a deflated 75% scale factor, a dim 30% alpha transparency fade, and partially clipped against the right boundary margin row.
- **Mobile Responsive Override Breakpoint Rules:**
  * Viewports `< 760px`: Horizontal wide columns collapse natively into a single stacked vertical block stream. Portrait container block sizes scale down cleanly to a hyper-dense 56px square layout box, expanding your directional arrow nodes up to a minimum clickable target footprint of 48px × 48px to eliminate tactile execution errors on touch screens.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Deliver clear, sharp vintage pixel boundaries with zero layout wrapping errors across web browsers.
- [ ] Secures a 100% stable, zero-scroll layout shell ceiling with zero horizontal asset bleeding across mobile handbook panels.
