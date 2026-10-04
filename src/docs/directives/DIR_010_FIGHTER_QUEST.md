# DIRECTIVE 010: FIGHTER MASTERWORK ARTIFACT QUEST ARRAYS

## 1. TARGET FILE
- `src/systems/fighter-quest-engine.js` (Populate this empty systems file exclusively)

## 2. STRUCTURAL MANDATES & NARRATIVE FLAG CALCULUS
- **Sole Proprietorship Governance:** Components belong strictly under the absolute management of Josh Wade (SSLLGGD&D™).
- **The Present-and-Living Vanguard Gate:** The engine must attach a strict conditional filter to every processing checkpoint: this master artifact quest line can ONLY initiate or advance if the Fighter companion is present, alive (`HP > 0`), and completely free of active status ailments within your active 4-man traveling vanguard roster.
- **ACT I: THE PLANAR INTERCEPT SEER GATES:**
  * Reaching Level 30 triggers an un-filterable prophetic trance from the Oakhaven street seer, tracking custom LDtk field value `utilityType: "RENOWN_GATEKEEPER"`. 
  * The script updates `party.storyFlags["fighter_quest_act1"] = true` and unlocks your purchased-clue journal cache logs inside the town Innkeeper rumor network catalog rows for 0 Copper pieces.
  * Interacting with the Medium NPC, Rerum, in the conduit city of Condutu redirects standard storefront menus to process a full ancestral spirit possession dialog choice node for Myrmido.
- **ACT II: THE CRYPT CIPHER MATRIX & MULTI-COORDINATE TILE MUTATIONS:**
  * Traversal steps EAST overworld wilderness paths lead to the Crypt of Heroes landmark coordinate block. The entryway blocks movement vectors via an impassable stone shield sculpture.
  * The 4-Element Statue-Sheath Puzzle: Features 4 sword items (`sword_ruby_hilt`, `sword_emerald_hilt`, `sword_sapphire_hilt`, `sword_topaz_hilt`) matching linguistic string cipher keys: `"Rubinus"`, `"Esmeraldu"`, `"Zaffiru"`, and `"Electrum"`.
  * Section 17-C Backlash Failure Reset Rule: If input index strings fail to match the solution matrix, instantly flush the tracking array pool to null, snap blades back to default layouts, siphon a flat -5 Stamina points from every individual vanguard member simultaneously, and drop a massive +50% Localized Commotion Pulse that triggers a flat-footed monster swarm ambush (`InitiativeEngine.surpriseState = "PARTY_SURPRISED"`).
  * Circuit Pass State: Aligning all four sheaths symmetrically triggers a `MUTATE_TILE` vector call to tilt/rotate the stone shield out of the grid paths, opening up a passable walkway (Value 0) to zone into the crypt dungeon.
  * Quadrant Choke-Point Drops: Defeating the spectral commanders *Atrox* (North-West) and *Ferox* (North-East) enforces a 100% guaranteed corpse harvest drop: `the_greatblade_blade_fragment_atrox` and `the_greatblade_blade_fragment_ferox`. Turning in all four verified pieces to Rerum executes an automated 180-degree directional pivot and 640ms alpha opacity fade-out animation loop to relocate into her shopfront parlor natively.
- **ACT III: THE FORGE LAB GRIND & THE DUAL-BLADE CONVERGENCE FUSION:**
  * Blacksmith Fravi in Cornuodia re-forges the chassis for a copper fee into a high-stat, non-magical weapon.
  * The 4-Floor Laboratory Oil Grind: Hunting abominations inside the Annex Tower features a strict 35% probabilistic oil drop check per corpse. Delivering the alchemical oils triggers a permanent quenching event pass, appending `item.isQuenched = true`. 
  * The Arcane Leyline Portal Wayfare: The town Wizard NPC node weaves an Arcane Leyline Bridge portal. The portal router enforces a rigid validation lock: it is completely barred from finding its target destination coordinates unless `vial_of_myrmidu_blood` occupies an active shared inventory slot to act as a tracking frequency.
  * The Battle for Mensura Virtutis: Teleports the vanguard directly onto a 32x32 active war-torn combat zone filled with hostile legion regiments, completely disabling retreat safety vectors.
  * Ultimate Fusion Script: Bumping Myrmido's spirit at the end of the battlefield permanently fuses the ancient powers back into the steel, mutating the weapon into the finalized cosmic relic weapon: The Monolithic Earth-Shatter Claymore (Hands Required: 2 | Quality Tier: 4 Masterwork Piece | `item.magic = true` | `item.durability = shatter-proof`), unlocking the zero-stamina **Titanic Shockwave Quake** ability on the Fighter dashboard, securely locked behind your Level 70 Required Level to Equip fence.
- **THE WHITE-OUT SPATIAL OVERDRIVE BLESSING:**
  * Completing the fusion dispatches a full-screen white flash animation across the canvas viewbox for a duration of 350ms, resetting positions flat onto the sidewalk tile directly adjacent to the town Wizard NPC node back in the mortal realm.
  * Executes a supreme divine purification pass, reviving any fallen companions, snapping all vital lines up to 100% capacity ceilings, and clearing all status ailments.
  * Appends the unique, non-degradable blessing status modifier: `party.modifiers["bellum_vector_blessing"]` onto the shared squad state manager, injecting an automatic, flat +20% damage and potency bonus to all offensive actions across the entire active vanguard for exactly 2 complete global calendar days (2,880 Game World Minutes) before cleanly purging from memory.
  * Embedded Portal Matrix: Pins a static, interactive escape coordinate block (`TILE_TYPES.PORTAL_EXIT`) positioned flat at the rear baseline vertex of the Mensura Virtutis grid, querying the active map file's underlying text variables registry (`zone.interactables.active_destination_map`) to handle re-entry loop exits dynamically.

## 3. DEFINITION OF DONE INTERACTION CHECKLIST
- [ ] Puzzle sequence states are tracked securely via local client-side memory caching arrays.
- [ ] Item rewards, fusions, and tile-swapping mutations execute with 0% asset duplication or data loss.
- [ ] Compiles cleanly using standard ES6 native module named imports/exports with zero placeholder loop blocks.

