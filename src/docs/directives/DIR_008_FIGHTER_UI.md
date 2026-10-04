# DIRECTIVE 008: FIGHTER POSTURE INTERFACE PANEL LAYER

## 1. TARGET FILE
- `src/ui/fighter-slice-panel.js` (Populate this empty module placeholder exclusively)

## 2. STRUCTURAL MANDATES & MUTUAL EXCLUSIVITY LAWS
- **Sole Proprietorship Governance:** Components belong strictly under the absolute ownership of Josh Wade (SSLLGGD&D™).
- **The Contextual UI Ingestion Trigger:** The lower interface rendering manager must mount the custom posture tray (`#fighter-posture-slice-tray`) natively *only* when the active Index 0 specialist or active hero character slot tracks a `classKey` exactly matching "fighter".
- **Silent Input Actions Bar Execution:** The interface panel is strictly prohibited from running any pop-up menus or alert window notifications upon turn start initialization. Stances must render as silent, clickable sub-menu cards on the dashboard, forcing the human player to manually track tactical situations and select their posture prior to confirming an offensive melee swing.
- **Mutually Exclusive State Lock:** Activating a new selection must instantly dispatch an execution call that overwrites the character sheet property register (`fighter.activeStance = String`) in local memory. The assignment of a new string token automatically purges and collapses the preceding posture from the register:
  ⮚ "BALANCED" (Default neutral baseline configuration)
  ⮚ "BULWARK" (Fortress Stance | Triggers Auto-Defend Intercept logic)
  ⮚ "RETALIATORY" (Vengeance Stance | Triggers out-of-turn counters)
  ⮚ "AGGRESSIVE" (High-frictional offensive damage multiplier)
  ⮚ "DEFENSIVE" (Individual hunkered armor class boost)
- **Real-Time Canvas Redraw Engine:** Confirming a posture toggle card must automatically invoke a pass down to `updateDashboardUI()` to recalculate your Section 3-A three-layer attribute modifications instantly, redrawing the viewport overlay layer to project the appropriate stance state badge graphics seamlessly.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Correctly binds UI pointer-events to update local state-machine properties with zero browser layout flickering.
- [ ] Layout scales down perfectly to fixed pixel boundaries beneath <760px responsive phone screens.
- [ ] Compiles fully using standard ES6 native module named imports/exports.
