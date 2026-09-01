// custom RPG class definitions and mechanics description
// ==========================================================
// 1. CLASS BLUEPRINTS & SKILL PROGRESSION
// ==========================================================
export const CLASS_DATA = {
  archmage: {
    name: "Archmage",
    color: "rgb(226, 101, 43)",
    desc: "Uses summoned constructs as servants and direct impact damaging spells...",
    portraits: {
      male: "dungeon-img/Sprite-ArchmageMaleStatusOK.png",
      female: "dungeon-img/Sprite-ArchmageMaleStatusOK.png",
    },
    abilities: [
      "cast spell",
      "defend",
      "melee attack",
      "meditate",
      "ranged attack",
    ],
    progression: {
      1: {
        basicAttack: {
          name: "Melee Attack",
          cost: 0,
          costType: "mp",
          basePower: 12,
          damageType: "blunt",
        },
        rangedAttack: {
          name: "Ranged Attack",
          cost: 0,
          costType: "stamina",
          basePower: 20,
          damageType: "piercing",
          tags: ["ranged", "throwing"],
        },
        spells: [
          {
            name: "Meteorite",
            skillType: ["magic", "spell"],
            description:
              "A summoned meteorite falls from above and explodes on impact.",
            targetType: "single",
            damageType: "fire",
            damageSplit: { fire: 20, physical: 10 },
            resistances: { fire: true, physical: false },
            basePower: 30,
            cost: 20,
            costType: "mp",
            isHeal: false,
            effects: [
              { name: "burn", chance: 0.8, resistable: true, duration: 4 },
              { name: "stun", chance: 0.2, resistable: false, duration: 1 },
            ],
            particleAsset: {
              id: "spell-sprite-meteorite",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
          {
            name: "Arcane Surge",
            skillType: ["magic", "spell"],
            description:
              "A surge of arcane energy that assaults the target with a shocking magic bolt.",
            targetType: "single",
            damageType: "arcane",
            damageSplit: { arcane: 25 },
            resistances: { arcane: true },
            basePower: 25,
            cost: 15,
            costType: "mp",
            isHeal: false,
            effects: [
              { name: "stun", chance: 0.2, resistable: true, duration: 3 },
            ],
            particleAsset: {
              id: "spell-sprite-arcanesurge",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
        ],
      },
    },
  },
  cleric: {
    name: "Cleric",
    color: "hsl(64, 100%, 50%)",
    desc: "Uses divination spells to heal single or whole group...",
    portraits: {
      male: "dungeon-img/Sprite-ArchmageMaleStatusOK.png",
      female: "dungeon-img/Sprite-ArchmageMaleStatusOK.png",
    },
    abilities: [
      "cast spell",
      "defend",
      "melee attack",
      "meditate",
      "ranged attack",
    ],
    progression: {
      1: {
        basicAttack: {
          name: "Melee Attack",
          cost: 0,
          costType: "mp",
          basePower: 12,
          damageType: "blunt",
        },
        rangedAttack: {
          name: "Ranged Attack",
          cost: 0,
          costType: "stamina",
          basePower: 20,
          damageType: "piercing",
          tags: ["ranged", "throwing"],
        },
        spells: [
          {
            name: "Heal",
            skillType: ["magic", "spell"],
            description: "restores a small ammount of hit points",
            targetType: "single",
            damageType: "divine",
            damageSplit: { divine: 22, vs_undead: -22 },
            resistances: { vs_undead: true },
            basePower: 22,
            cost: 8,
            costType: "mp",
            isHeal: true,
            effects: [
              { name: "heal", chance: 1.0, resistable: true, duration: 4 },
            ],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
        ],
      },
    },
  },
  doppleganger: {
    name: "Doppleganger",
    color: "#35e512",
    desc: "Uses mimicking skills to have any one surrounding entity's abilities...",
    portraits: {
      male: "dungeon-img/Sprite-DopplegangerFemaleStatusOK.png",
      female: "dungeon-img/Sprite-DopplegangerFemaleStatusOK.png",
    },
    abilities: [
      "cast spell",
      "defend",
      "melee attack",
      "mimic entity",
      "ranged attack",
    ],
    progression: {
      1: {
        basicAttack: {
          name: "Melee Attack",
          cost: 0,
          costType: "mp",
          basePower: 12,
          damageType: "piercing",
        },
        rangedAttack: {
          name: "Ranged Attack",
          cost: 0,
          costType: "stamina",
          basePower: 20,
          damageType: "piercing",
          tags: ["ranged", "throwing"],
        },
        spells: [
          {
            name: "vengeful reflection",
            skillType: ["magic", "spell"],
            description:
              "reflects 10% of all incomming damage onto spell target",
            targetType: "single",
            damageType: "magic",
            damageSplit: { magic: 22 },
            resistances: { magic: true },
            basePower: 22,
            cost: 8,
            costType: "mp",
            isHeal: false,
            effects: [
              {
                name: "vengeful reflection",
                chance: 1.0,
                resistable: true,
                duration: 4,
              },
            ],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
        ],
      },
    },
  }, // FIXED: Changed }; to a clean comma link to attach the enchanter cleanly
  enchanter: {
    name: "Enchanter",
    color: "#ff69b4",
    desc: "Uses telepathy, telekinesis, and persuasion to manipulate minds...",
    portraits: {
      male: "dungeon-img/Sprite-EnchanterFemaleStatusOK.png",
      female: "dungeon-img/Sprite-EnchanterFemaleStatusOK.png",
    },
    // FIXED: Updated camelCase tags to your clean lowercase spaced lookup formats
    abilities: [
      "cast spell",
      "defend",
      "melee attack",
      "meditate",
      "ranged attack",
    ],
    progression: {
      1: {
        basicAttack: {
          name: "Melee Attack",
          cost: 0,
          costType: "mp",
          basePower: 12,
          damageType: "piercing",
        },
        rangedAttack: {
          name: "Ranged Attack",
          cost: 0,
          costType: "stamina",
          basePower: 20,
          damageType: "piercing",
          tags: ["ranged", "throwing"],
        },
        spells: [
          {
            name: "spell name",
            skillType: ["magic", "spell"],
            description: "",
            targetType: "single",
            damageType: "magic",
            damageSplit: { magic: 22 },
            resistances: { magic: true },
            basePower: 22,
            cost: 8,
            costType: "mp",
            isHeal: false,
            effects: [{ name: "", chance: 1.0, resistable: true, duration: 4 }],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
        ],
      },
    },
  },
  fighter: {
    name: "Fighter",
    color: "rgb(206, 13, 13)",
    desc: "Tough melee fighter also proficient with archery...",
    portraits: {
      male: "dungeon-img/Sprite-FighterMaleStatusOK.png",
      female: "dungeon-img/Sprite-FighterFemaleStatusOK.png",
    },
    // FIXED: Updated camelCase tags to your clean lowercase spaced lookup formats
    abilities: [
      "maneuvers",
      "defend",
      "melee attack",
      "ranged attack",
      "adreneline rush",
    ],
    progression: {
      1: {
        basicAttack: {
          name: "Melee Attack",
          cost: 0,
          costType: "stamina",
          basePower: 13,
          damageType: "physical",
        },
        rangedAttack: {
          name: "Ranged Attack",
          cost: 0,
          costType: "stamina",
          basePower: 25,
          damageType: "piercing",
          tags: ["ranged", "throwing"],
        },
        spells: [
          {
            name: "Precision Shot",
            skillType: ["combat maneuver"],
            description: "",
            targetType: "single",
            damageType: "physical",
            damageSplit: { physical: 100 },
            resistances: { magic: true },
            basePower: 22,
            cost: 8,
            costType: "mp",
            isHeal: false,
            effects: [{ name: "", chance: 1.0, resistable: true, duration: 4 }],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
          {
            name: "Superb Shot",
            skillType: ["combat maneuver"],
            description: "",
            targetType: "single",
            damageType: "ranged",
            damageSplit: { physical: 5, piercing: 25 },
            resistances: { magic: true },
            basePower: 30,
            cost: 10,
            costType: "mp",
            isHeal: false,
            effects: [
              { name: "", chance: 1.0, resistable: false, duration: 4 },
            ],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
        ],
      },
    },
  },

  geomancer: {
    name: "Geomancer",
    color: "hsl(179, 75%, 47%)",
    desc: "Manipulates surrounding elements, able to use vines/plants...",
    portraits: {
      male: "dungeon-img/Sprite-GeomancerMaleStatusOK.png",
      female: "dungeon-img/Sprite-GeomancerMaleStatusOK.png",
    },
    // FIXED: Mapped camelCase strings to unified lowercase space-separated formats
    abilities: ["cast spell", "defend", "melee attack", "meditate"],
    progression: {
      1: {
        basicAttack: {
          name: "Melee Attack",
          cost: 0,
          costType: "stamina",
          basePower: 13,
          damageType: "physical",
        },
        rangedAttack: {
          name: "Ranged Attack",
          cost: 0,
          costType: "stamina",
          basePower: 20,
          damageType: "piercing",
          tags: ["ranged", "throwing"],
        },
        spells: [
          {
            name: "Stranglevine Wrap",
            skillType: ["magic", "spell"],
            description: "",
            targetType: "single",
            damageType: "physical",
            damageSplit: { physical: 100 },
            resistances: { magic: true },
            basePower: 22,
            cost: 8,
            costType: "mp",
            isHeal: false,
            effects: [{ name: "", chance: 1.0, resistable: true, duration: 4 }],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
          {
            name: "Acid Rain",
            skillType: ["magic", "spell"],
            description: "a toxic cloud rains acid down on target area",
            targetType: "aoe",
            damageType: "elemental",
            damageSplit: { physical: 10, elemental: 12 },
            resistances: { magic: true },
            basePower: 22,
            cost: 16,
            costType: "mp",
            isHeal: false,
            effects: [{ name: "", chance: 1.0, resistable: true, duration: 4 }],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
          {
            name: "Sandstorm",
            skillType: ["magic", "spell"],
            description: "a toxic cloud rains acid down on target area",
            targetType: "aoe",
            damageType: "elemental",
            damageSplit: { physical: 10, elemental: 12 },
            resistances: { elemental: false },
            basePower: 22,
            cost: 16,
            costType: "mp",
            isHeal: false,
            effects: [{ name: "", chance: 1.0, resistable: true, duration: 4 }],
            particleAsset: {
              id: "placeholder",
              duration: 2,
              intensity: "high",
              spawnAt: "target",
            },
          },
        ],
      },
    },
  },
};
// ==========================================================
// 2. GRID ENVIRONMENT MAP DATA & TILE TARGETS
// ==========================================================
export const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
  DOOR: 2,
  ZONE_EXIT: 3,
  CHEST: 4,
  NPC: 5,
  MERCHANT: 6,
  PUZZLE_ITEM: 7,
  TREES: 8,
};

export const town1Map = [
  [1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1],
  [1, 0, 6, 6, 0, 1, 0, 2, 0, 0, 6, 1],
  [1, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 1],
  [1, 1, 1, 2, 1, 1, 0, 1, 2, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 0, 2, 0, 1],
  [1, 0, 2, 0, 1, 5, 1, 0, 0, 1, 0, 1],
  [1, 6, 1, 0, 1, 0, 1, 0, 0, 1, 6, 1],
  [1, 1, 1, 0, 1, 2, 1, 0, 0, 1, 1, 1],
  [1, 5, 1, 0, 0, 0, 0, 0, 0, 1, 5, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 1],
  [1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1],
];

// ==========================================================
// 3. SPAWNING DYNAMIC MONSTER CATALOGS
// ==========================================================
export const monsterCatalog = {
  possessedSkeleton: {
    name: "Possessed Skeleton",
    classKey: "fighter",
    hp: 45,
    maxHp: 45,
    stats: { str: 12, sta: 6, dex: 8, ac: 4, int: 5, wis: 5, agil: 6, char: 2 },
  },
  rogue_construct: {
    name: "Rogue Sentry Construct",
    classKey: "archmage",
    hp: 60,
    maxHp: 60,
    stats: {
      str: 10,
      sta: 6,
      dex: 6,
      ac: 8,
      int: 14,
      wis: 4,
      agil: 4,
      char: 1,
    },
  },
  diseased_rat: {
    name: "Diseased Rat",
    classKey: "fighter",
    hp: 30,
    maxHp: 30,
    stats: { str: 8, sta: 4, dex: 10, ac: 2, int: 3, wis: 4, agil: 8, char: 1 },
  },
};

// ==========================================================
// 4. UNIVERSAL WEAPON CATALOG BLUEPRINTS
// ==========================================================
export const WEAPON_CATALOG = {
  iron_shortsword: {
    name: "Iron Shortsword",
    description: "A reliable, standard-issue vanguard blade.",
    basePower: 15,
    damageType: "slashing",
    accuracy: 0.95,
    handsRequired: 1,
    statModifiers: { str: 2, agil: 0 },
    onHitEffects: [{ name: "bleed", chance: 0.1, duration: 3 }],
  },
  oak_quarterstaff: {
    name: "Oak Quarterstaff",
    description:
      "An enchanted conduit that balances physical force and mystical focus.",
    basePower: 10,
    damageType: "bludgeoning",
    accuracy: 0.9,
    handsRequired: 2,
    statModifiers: { int: 3, wis: 2 },
    onHitEffects: [],
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
  },
};
