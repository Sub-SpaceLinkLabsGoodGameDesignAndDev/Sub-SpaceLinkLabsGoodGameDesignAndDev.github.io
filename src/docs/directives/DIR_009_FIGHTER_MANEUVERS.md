# DIRECTIVE 009: FIGHTER MANEUVERS MATRIX & STANCE MODIFIERS MATH

## 1. TARGET FILE
- `src/systems/fighter-combat-logic.js` (Populate this empty systems file exclusively)

## 2. STRUCTURAL EQUATIONS & INTERCEPTOR PATHS
- **Stance Mathematical Intercepts:** Wire up your combat execution pipelines inside `combat-formulas.js` to dynamically look up the Fighter's `activeStance` token during injury math loops, applying your strict modifier coefficients:
  * **Bulwark Stance:** Grants flat +15 AC and +10% Parry Chance, while enforcing a strict -10% Avoidance/Evasion penalty. Engages 25% chance to swallow 100% of physical damage directed at rear-rank casters at a cost of 2 Stamina per intercept.
  * **Retaliatory Stance:** Enforces a strict -10% Evasion penalty. Triggers a `Math.min(0.50, agil * 0.04)` out-of-turn basic melee weapon strike execution roll whenever an ally is struck, siphoning 1 Stamina from the Fighter and throttling global randomized swing damage variance down to a deflated 45% to 85% range.
  * **Aggressive Posture:** Lowers active defensive stature by an automatic -15% AC milestone-scaled penalty while injecting a flat +20% Brutal Damage Modifier to final rounded total split damage outputs.
  * **Defensive Posture:** Fortifies active armor plating by a dynamic +20% AC bonus layer while throttling final weapon swing boundaries down to a deflated 60% to 90% range.
- **Pure Melee Progressive Stamina Cost Escalation Law:** Enforce your strict progression strain gate. As skills advance in Roman Numeral rank suffixes (Ranks I to X) inside the Barracks Academy, their physical execution costs must progressively scale upward, balanced by the Fighter carrying a significantly larger trained Stamina pool than fragile casters.
- **The Shared Cumulative Carriage Attrition Squeeze:** If an active companion's Stamina register drops to absolute 0, append a persistent +15% Localized Commotion Noise Penalty to your step counter per head. If the collective un-exhausted Stamina pool of the entire active vanguard team drops below 10% maximum capacity, completely freeze mobility handlers until resource pools are replenished.
- **Granular Triage Separation Fence:** Program the `Field Medic` ability array (Ranks I to X). The capability draws 0 Mana, using daily calendar charges. It is strictly barred from selection unless the targeted portrait tracks current HP `<= Low-HP Check Value` (e.g., `<=20%` Max HP for Rank I up to `<=35%` Max HP for Rank X). It completely rejects numeric healing variables, instantly snapping the target's current health register flat to a hard target redline ceiling of exactly 40% up to 75% of Maximum HP. Flawlessly flushes `BLEEDING`, `POISONED`, `MESMERIZED`, and `CONFUSED` status ailments while locking a near-impossible 1% maximum base chance to interact with advanced unholy afflictions like `NECROTIC_CURSE`.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] All damage splits, parry calculations, and resource siphons execute down to absolute rounded integers.
- [ ] Out-of-turn retaliation strikes insert natively into the active combat queue array without corrupting chronology indicators.
- [ ] Features zero placeholder loops or missing dependency file paths.
