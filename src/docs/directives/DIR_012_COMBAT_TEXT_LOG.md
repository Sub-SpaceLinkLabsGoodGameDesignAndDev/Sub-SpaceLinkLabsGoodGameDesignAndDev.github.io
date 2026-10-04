# DIRECTIVE 012: ALL-CAPS CHRONOLOGICAL TEXT LOG HUD CONTROLLER

## 1. TARGET ENGINE FILE
- `src/ui/text-log-hud.js` (Populate this empty UI layout tracker file exclusively)

## 2. STRUCTURAL MANDATES & TYPOGRAPHY OUTLINE RULES
- **Sole Proprietorship Governance:** Operational scripts belong strictly to proprietor Josh Wade (SSLLGGD&D™).
- **The Universal Text Shadow Fortification Rule:** To completely eliminate visual text bleeding and bad contrast profiles over dark panel backgrounds, all dynamically appended text strings inside the rolling event log viewbox must enforce a highly concentrated, non-blurred 4-directional black shadow outline matrix:
  `text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0px 0px 6px rgba(0,0,0,0.9);`
- **Chronological Multi-Line Rolling Append Loop:** Build an automated string log controller (`pushLog()`) that pushes fresh event text nodes straight into the text log window frame, automatically trimming obsolete entries past a 50-line storage cap to protect browser memory scales.
- **The Retro Arcade ALL-CAPS Template Engine:** All core combat transactions, hazard depletions, and tactical stance modifications must display using high-contrast, uppercase monospaced layouts, wrapping critical entities in colored color styles:
  * Posture Changes: `"🔄 POSTURE SHIFT: HERO ADOPTS MUTUALLY EXCLUSIVE [STANCE NAME] STANCE."`
  * Incapacitation: `"☠️ VOID CRISIS: [COMPANION NAME] HAS SUCCUMBED TO STATUS ATTRITION AND COLLAPSED!"`
  * Defensive Shield Intercepts: `"🛡️ FORTRESS BLOCK: FIGHTER SWALLOWS ATTACK VECTOR TO PROTECT REAR ALLY. -2 STAMINA."`
  * Stance-Shatter Backlash: `"❌ POSITION COLLAPSE: POMMEL STRIKE CRUSHES FOE DISCIPLINE. ACTIVE STANCE RESET TO NONE. -4 AC."`
  * Puzzle Failure Backlash: `"💥 MECHANISM JAM: GEARS SNAP VIOLENTLY TO STARTING POSITION. -5 STAMINA FOR ALL ALLIES. +10 MINUTES PASSED."`

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Log window frames append new text rows smoothly with automated vertical scrolling to anchor the latest line.
- [ ] Text nodes remain perfectly visible and sharp across both full desktop viewports and 9px mobile layouts.
- [ ] Compiles fully using standard ES6 native module named imports/exports.
