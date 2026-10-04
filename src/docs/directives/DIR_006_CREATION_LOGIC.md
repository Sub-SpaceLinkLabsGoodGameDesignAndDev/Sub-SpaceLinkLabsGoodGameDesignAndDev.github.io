# DIRECTIVE 006: CHARACTER CREATION CONTROLLER & POINT-BUY UTILITIES

## 1. TARGET FILE
- `src/systems/character-creation.js` (Populate this empty placeholder file exclusively)

## 2. STRUCTURAL MANDATES & INTERACTION CODES
- **Sole Proprietorship Governance:** Systems belong strictly under the absolute management of legal owner Josh Wade (SSLLGGD&D™).
- **The GAME_STATE State Machine:** Upon character creation initialization, shift the system runtime loop pointer natively to `gameState = "CLASS_SELECT"`, automatically forcing the absolute HTML creation mainframe box to mount centered flat over the screen layout frame.
- **The ALL-CAPS Text Input Fence:** Wire up your text input verification string loop to support an automated uppercase text filter. Enforce a strict 12-character name substring ceiling: `inputName.substring(0,12)`.
- **The Dual-Trigger Touch Submission Law:** Reject hidden key-listeners. Every input frame must render a dedicated, physical click-capture submission button card node positioned right beneath the input bar to process Uppercase Input Confirmation:
  `[BUTTON id="input-submit-btn" class="buy-btn"] ⮚ CONFIRM IDENTITY [/BUTTON]`
- **The Floating Point-Buy Allocation Array:** Initialize a floating `creationBonusPool = 5;` tracker. Inside your column matrix layout, display this counter directly above the stat values within the exact same vertical column block, placing its text label strictly to the left. Text labels inside this segment must render in vintage retro arcade ALL-CAPS:
  `"BONUS ATTRIBUTE POINTS REMAINING"`
- **The Point-Buy Boundary Locks:** Decrement `[-]` and Increment `[+]` button interactions must execute strictly bounded calculation validation checks:
  * Increment Check: If a target stat is `>= 9` OR if `creationBonusPool <= 0`, block inputs natively.
  * Decrement Check: If a target stat is `<= 2` OR drops to its native Level 1 Class baseline (e.g., Fighter starting at 5 STA), lock the button to prevent values from dropping below 2 points.
  * Real-Time HP Sync: Increasing or decreasing Stamina (STA) must instantly trigger an automated background execution call to your newly locked `BaseEntity.js` calculations to update Max HP ceilings dynamically: `Max HP = 10 + (STA * 2)`.
- **The Text Log HUD ALL-CAPS Alert Strings:** Output precise chronological text notifications flat to your Text Log HUD window frame using an all-caps retro arcade template format upon point allocation changes:
  * `"🟢 ATTRIBUTE UPGRADED: STRENGTH INCREASED TO [VALUE]."`
  * `"🔴 ATTRIBUTE DOWNGRADED: STAMINA DECREASED TO [VALUE]."`

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Interface layout functions natively using standard ES6 named module imports/exports.
- [ ] Provides 100% stable, zero-scroll static terminal presentation across desktop and mobile screens.
- [ ] Compiles cleanly with zero mathematical rounding floating-point drift anomalies.
