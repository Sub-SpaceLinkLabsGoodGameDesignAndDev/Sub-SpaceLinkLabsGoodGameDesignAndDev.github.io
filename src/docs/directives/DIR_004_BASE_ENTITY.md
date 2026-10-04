# DIRECTIVE 004: BASE ENTITY CONSTRUCTOR & THREELAYER ATTRIBUTE MATRIX

## 1. TARGET ENGINE FILE
- `src/data/entities/BaseEntity.js` (Populate this empty placeholder file exclusively)

## 2. STRUCTURAL MANDATES & SYSTEM EQUATIONS
- **Sole Proprietorship Configuration:** Operational components belong strictly to proprietor Josh Wade (SSLLGGD&D™).
- **The Three-Layer Attribute Stacking Register:** Every entity instance must initialize tracking independent values across three distinct layers to prevent data bleeding:
  `Total Stat Value = base_stat + trained_stat + equipment_bonuses + active_effect_bonuses`
- **Maximum Hit Points:** Start from `10 + (total_STA * 2)`, add explicit flat `hpBonus` values, then apply each explicit `hpPercent` value sequentially and multiplicatively. Floor the final result and never allow maximum HP below zero. Five total STA with no other modifiers yields 20 maximum HP.
  ⮚ Equipment and active effects may contribute additive `statModifiers`, explicit percentage `statPercentModifiers`, flat `hpBonus`, and percentage `hpPercent` fields. Flat modifiers are not inferred to be percentages.
  ⮚ Active effects require a stable `sourceId`. Reapplying the same source refreshes/replaces its modifiers by default; a different source stacks independently. An effect may explicitly set `stacking: "stack"` to permit multiple instances from the same source. Each applied instance has an `effectId` for removal.
  ⮚ Recalculate maximum HP when equipment, effects, or base/trained STA changes. Preserve current HP as an absolute value; clamp it down only when it exceeds the recalculated maximum. Increasing maximum HP does not heal the entity.
- **Progressive Natural Armor Class Floor Scale:** Naked vanguard slots or unarmored entities natively derive a defensive protective floor scaled directly by character milestones:
  `Natural AC Floor = 1 + Math.floor(Character Level / 2)`
  ⮚ Total AC Value calculation must cascade smoothly: `Total AC = Natural AC Floor + Trained AC + Equipped Gear AC modifiers`.
- **Universal Class-Restricted Equipment Fences:** Every weapon or wearable apparel asset must cross-reference the character's primitive `classKey`. If a player attempts an invalid slot assignment, block placement entirely and flash the high-visibility crimson overlay alert bar: `"❌ CLASS MISMATCH: THIS EQUIPMENT'S STRUCTURAL CONFIGURATION CANNOT BE WIELDED BY A [CLASS NAME]!"`
- **Two-Handed Mainhand Shunt Lock:** Equipping an active weapon carrying a property of `handsRequired: 2` into the primary mainhand slot must instantly dispatch an automatic unequip command to the secondary offhand paperdoll slot index, shifting any shield or secondary dagger safely back into the shared inventory bags with 0% data culling.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Constructor correctly handles standard ES6 module imports/exports for all 16 paperdoll core slots.
- [ ] Correctly processes item data updates down to single-copper common denominators (`player.totalCopper`).
- [ ] Floors calculated maximum HP after sequential percentage modifiers and preserves current HP when the maximum changes.
- [ ] Compiles fully with zero mathematical rounding floating-point drift anomalies.
