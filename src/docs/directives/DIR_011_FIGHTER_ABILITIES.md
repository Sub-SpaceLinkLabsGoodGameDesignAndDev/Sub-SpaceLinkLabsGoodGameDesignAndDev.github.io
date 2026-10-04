# DIRECTIVE 011: FIGHTER SPECIALIZED ABILITIES CALCULUS

## 1. TARGET ENGINE FILE
- `src/systems/fighter-abilities-core.js` (Populate this empty Systems file exclusively)

## 2. STRUCTURAL EQUATIONS & HORDE RE-ROUTING LAWS
- **Sole Proprietorship Governance:** Systems belong strictly under the absolute management of Josh Wade (SSLLGGD&D™).
- **The Context-Switching Bash Maneuver Engine:** Create a unified input action handler that checks equipped paperdoll slot elements dynamically. It must automatically overwrite the interface layout string titles based exclusively on your active gear layers:
  * If an offhand shield asset is slotted (`equipmentSlots.offhand !== null`), render the command bar node natively as `"Shield Bash"`.
  * If a two-handed weapon is equipped and the player has purchased the Barracks specialization modifier (`handsRequired: 2`), render the node as `"Weapon Bash"`.
- **Bash Stun Calculation Loop (Ranks I to X):** Executing this strike siphons your progressive physical Stamina cost and rolls an attribute-scaled check against the target entity. On a successful hit, it applies a flat probability check starting at a 50% chance to apply a 1-round `STUNNED` stasis lock condition, scaling linearly across Roman Numeral suffixes up to an absolute **97% base chance for a 1-to-3 round stun at Rank X**.
- **The Concussive Ram Spatial Displacement Loop (Ranks I to X):**
  * **Low-Tier Ranks (I to IV):** Landing a successful strike at Distance 0 or 1 cells breaks the melee lock, physically launching the focal enemy model cardinally backward exactly 1 cell away from the vanguard. 
  * **Horde Cluster Evolution (Ranks V to X):** When executing this maneuver inside Section 19 massive cohort battles, the strike breaks single-target restrictions to crash into whole frontline regiments. The targeted front-rank monster is violently hurled out of the active rank entirely, decrementing `activeFrontRankCount` and shunting them straight into the quadrant's background `reservePoolCount` integer registry.
  * **The Regiment Domino Cascade Equation:** As the displaced unit smashes into the background rows, the core combat formulas completely bypass frontline containment barriers: it calculates exactly **50% of the primary strike's final rounded damage output** and delivers it as an un-mitigated kinetic splash payload straight into the `reservePoolCount` integer to implode background reinforcement lines before they can step onto the active field blocks.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Ability actions execute and modify state targets with 0% data culling or asset duplication loops.
- [ ] Target-ring highlights (`.tactical-targeting-ring`) adjust colors cleanly to reflect threat indices.
- [ ] Compiles fully using standard ES6 native module named imports/exports.
