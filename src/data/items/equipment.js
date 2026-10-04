/*
========================================================================
⚠️ [LEGACY REFERENCE GATEWAY — NOT DEFINITIVE RUNTIME SCHEMA]
========================================================================
The data tracking entries below represent a primitive, un-slotted legacy prototype
footprint. GitHub Copilot must treat these modules as pure abstract scaffolding context.
DO NOT patch these records in place or use their hardcoded metrics.
All logic processing pipelines must draw variables fluidly from game-config.js
and update attributes strictly to conform to the RoI_MASTER_BLUEPRINT.md
========================================================================


export const LEGACY_SCAFFOLD_EQUIPMENT = {
 unbalanced_dagger: {
    name: "Unbalanced Dagger",
    description: "A poorly balanced dagger, but its very sharp.",
    basePower: 7,
    damageType: "piercing",
    accuracy: 0.84,
    handsRequired: 1,
    statModifiers: { agil: 2, dex: 1 },
    onHitEffects: [{ name: "bleed", chance: 0.1, duration: 3 }]
  },
  rusty_rapier: {
    name: "Rusty Rapier",
    description: "A rusted rapier with a dull blade.",
    basePower: 7,
    damageType: "piercing",
    accuracy: 0.88,
    handsRequired: 1,
    statModifiers: { agil: 2, dex: 1 },
    onHitEffects: [{ name: "tetinus", chance: 0.1, duration: 3 }],
    value: 5
  },
  dull_bastardsword: {
    name: "Dull Bastard Sword",
    description: "A worn-down bastard sword with a dull edge.",
    basePower: 9,
    damageType: "slashing",
    accuracy: 0.83,
    handsRequired: 2,
    statModifiers: { str: 3, agil: -1 },
    onHitEffects: [{ name: "stun", chance: 0.1, duration: 2 }],
    value: 7,
  },
  cracked_quarterstaff: {
    name: "Cracked Quarterstaff",
    description:
      "A damaged but still functional quarterstaff.",
    basePower: 5,
    damageType: "bludgeoning",
    accuracy: 0.9,
    handsRequired: 2,
    statModifiers: { int: 1, wis: 1 },
    onHitEffects: [],
    value: 5,
  },
  composite_recurve: {
    name: "Composite Recurve Bow",
    description:
      "Lightweight layered horn and wood designed for high-tension piercing strikes.",
    basePower: 18,
    damageType: "piercing",
    accuracy: 0.88,
    handsRequired: 2,
    statModifiers: { dex: 4 },
    onHitEffects: [],
    value: 40,
  },
  iron_shortsword: {
    name: "Iron Shortsword",
    description: "A reliable, standard-issue vanguard blade.",
    basePower: 15,
    damageType: "slashing",
    accuracy: 0.95,
    handsRequired: 1,
    statModifiers: { str: 2, agil: 0 },
    onHitEffects: [{ name: "bleed", chance: 0.1, duration: 3 }],
    value: 25,
  },
};
*/