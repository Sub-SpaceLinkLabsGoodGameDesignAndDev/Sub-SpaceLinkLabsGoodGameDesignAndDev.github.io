import { CLASS_DATA, WEAPON_CATALOG } from "./dungeon-data.js";

// ==========================================================
// 1. DATA LOOKUPS & DICTIONARIES
// ==========================================================
export const DamageTypes = {
  PHYSICAL: "physical",
  RANGED: "ranged",
  ELEMENTAL: "elemental",
  DIVINE: "divine",
  PSYCHIC: "psychic",
  FIRE: "fire",
  COLD: "cold",
  LIGHTNING: "lightning",
  POISON: "poison",
  ARCANE: "arcane",
  SLASHING: "slashing",
  PIERCING: "piercing",
  BLUDGEONING: "bludgeoning",
  FALL: "fall",
  MAGIC: "magic",
  NECROTIC: "necrotic",
  RADIANT: "radiant",
  VS_UNDEAD: "vs_undead",
};

export const ENCOUNTER_TYPES = {
  HERO: "hero",
  ENEMY: "enemy",
  BARTER: "barter window",
  DIALOGUE: "npc dialogue window",
};

export const SKILLS = {
  RIPOSTE: ["riposte"],
  PARRY: ["parry"],
  DODGE: ["dodge"],
  BLOCK: ["block"],
  COUNTER: ["counterattack"],
};

export const ABILITIES = {
  MELEE: ["melee", "melee attack"],
  RANGE: ["range", "ranged", "ranged attack", "throw"],
  USE_MAGIC: ["use magic", "cast spell"],
  USE_ITEM: ["use item"],
  MANEUVERS: ["maneuvers"],
  ADRENELINE_RUSH: ["adreneline rush"],
  MIMIC_ENTITY: ["mimic entity", "mimic"],
  DEFEND: ["defend"],
  MEDITATE: ["meditate"],
  RUN: ["run"],
};
// ==========================================================
// 2. UNIVERSAL CLASS ENTITY DESIGN ENGINE
// ==========================================================
class BaseEntity {
  constructor(config, customData = {}) {
    this.name = customData.name || "Unnamed Entity";
    this.classKey = (
      customData.classType ||
      customData.classKey ||
      "fighter"
    ).toLowerCase();
    this.classType = this.classKey;
    this.level = Math.min(Math.max(customData.level || 1, 1), 100);
    this.gender = customData.gender || "male";
    this.maxHp = customData.maxHp || 100;
    this.hp = customData.hp ?? this.maxHp;
    this.maxMp = customData.maxMp || 50;
    this.mp = customData.mp ?? this.maxMp;
    this.maxStamina = customData.maxStamina || 100;
    this.stamina = customData.stamina ?? this.maxStamina;

    this.description = config.description;
    this.encounterType = config.encounterType;
    this.monsterTags = customData.monsterTags || config.monsterTags || [];
    this.merchantTags = customData.merchantTags || config.merchantTags || [];
    this.companionTags = customData.companionTags || config.companionTags || [];

    this.stats = customData.stats ||
      config.stats || {
        str: 10,
        dex: 10,
        ac: 10,
        int: 10,
        wis: 10,
        agil: 10,
        char: 10,
      };

    const designBlueprint = CLASS_DATA[this.classKey];
    if (designBlueprint) {
      this.className = designBlueprint.name;
      this.uiColor = designBlueprint.color;
      this.classDescription = designBlueprint.desc;
      this.portrait =
        designBlueprint.portraits?.[this.gender] ||
        designBlueprint.portraits?.male ||
        "";
      this.abilities = [...(designBlueprint.abilities || [])];
    }

    this.skills = this.calculateSkills();
    this.spellbook = this.getUnlockedSpells();
    this.equippedWeapon = null;

    if (customData.startingWeaponKey) {
      this.equipWeapon(customData.startingWeaponKey);
    }
  }

  calculateSkills() {
    const calculated = {};
    for (const skillName of Object.keys(SKILLS)) {
      calculated[skillName] = this.level;
    }
    return calculated;
  }

  getUnlockedSpells() {
    const unlocked = [];
    const designBlueprint = CLASS_DATA[this.classKey];
    if (!designBlueprint || !designBlueprint.progression) return unlocked;

    for (const [lvl, unlockData] of Object.entries(
      designBlueprint.progression,
    )) {
      const levelNumber = parseInt(lvl, 10);
      if (Number.isNaN(levelNumber) || levelNumber > this.level) continue;

      if (Array.isArray(unlockData.spells)) {
        unlocked.push(...unlockData.spells);
      }
    }
    return unlocked;
  }

  getModifiedStat(statName) {
    let baseValue = this.stats[statName] || 10;
    if (
      this.equippedWeapon &&
      this.equippedWeapon.statModifiers &&
      this.equippedWeapon.statModifiers[statName]
    ) {
      baseValue += this.equippedWeapon.statModifiers[statName];
    }
    return baseValue;
  }

  equipWeapon(weaponKey) {
    this.equippedWeapon = weaponFactory.create(weaponKey);
    console.log(`⚔️ ${this.name} equipped ${this.equippedWeapon.name}!`);
  }
}

export const entityFactory = {
  player: (customData) =>
    new BaseEntity(
      { description: "Party Leader", encounterType: ENCOUNTER_TYPES.HERO },
      customData,
    ),
  monster: (customData) =>
    new BaseEntity(
      {
        description: "Combat Encounter Target",
        encounterType: ENCOUNTER_TYPES.ENEMY,
      },
      customData,
    ),
  companion: (customData) =>
    new BaseEntity(
      { description: "Party Member", encounterType: ENCOUNTER_TYPES.HERO },
      customData,
    ),
};
// ==========================================================
// 3. WEAPON INSTANCE FACTORY LAYER
// ==========================================================
class WeaponInstance {
  constructor(weaponKey, customData = {}) {
    const blueprint = WEAPON_CATALOG[weaponKey];
    if (!blueprint) {
      throw new Error(
        `⚠️ Error: Weapon blueprint "${weaponKey}" missing from catalog templates.`,
      );
    }

    this.weaponKey = weaponKey;
    this.name = customData.name || blueprint.name;
    this.description = blueprint.description;
    this.basePower = blueprint.basePower;
    this.damageType = blueprint.damageType;
    this.accuracy = blueprint.accuracy;
    this.handsRequired = blueprint.handsRequired;

    this.statModifiers = blueprint.statModifiers || {};
    this.onHitEffects = [...(blueprint.onHitEffects || [])];
  }
}

export const weaponFactory = {
  create: (weaponKey, customData) => new WeaponInstance(weaponKey, customData),
};

// ==========================================================
// 4. STAT-SCALED COMBAT FORMULAS
// ==========================================================
export const CombatFormulas = {
  calculateBaseOutput(attacker, damageType, baseValue) {
    let modifier = 0;

    const strength = attacker.getModifiedStat
      ? attacker.getModifiedStat("str")
      : 10;
    const dexterity = attacker.getModifiedStat
      ? attacker.getModifiedStat("dex")
      : 10;
    const intelligence = attacker.getModifiedStat
      ? attacker.getModifiedStat("int")
      : 10;
    const wisdom = attacker.getModifiedStat
      ? attacker.getModifiedStat("wis")
      : 10;
    const charisma = attacker.getModifiedStat
      ? attacker.getModifiedStat("char")
      : 10;

    switch (damageType) {
      case DamageTypes.PHYSICAL:
      case DamageTypes.SLASHING:
      case DamageTypes.PIERCING:
      case DamageTypes.BLUDGEONING:
        modifier = (strength - 10) * 0.05;
        break;

      case DamageTypes.RANGED:
        modifier = (dexterity - 10) * 0.05;
        break;

      case DamageTypes.ELEMENTAL:
      case DamageTypes.FIRE:
      case DamageTypes.COLD:
      case DamageTypes.LIGHTNING:
      case DamageTypes.POISON:
      case DamageTypes.ARCANE:
      case DamageTypes.MAGIC:
        modifier = (intelligence - 10) * 0.07;
        break;

      case DamageTypes.DIVINE:
      case DamageTypes.NECROTIC:
      case DamageTypes.RADIANT:
      case DamageTypes.VS_UNDEAD:
        modifier = (wisdom - 10) * 0.06;
        break;

      case DamageTypes.PSYCHIC:
        modifier = (charisma - 10) * 0.05;
        break;

      default:
        modifier = 0;
    }

    const combatWeaponPower = attacker.equippedWeapon
      ? attacker.equippedWeapon.basePower
      : 0;
    const combinedBasePower = baseValue + combatWeaponPower;

    const scaledValue = combinedBasePower * (1 + modifier);
    const variance = 0.85 + Math.random() * 0.3;
    return Math.floor(scaledValue * variance);
  },

  calculateFinalMitigation(rawOutput, damageType, defender) {
    const stats = defender.stats || { ac: 0, agil: 10, int: 10 };
    let finalDamage = rawOutput;

    if (
      [
        DamageTypes.PHYSICAL,
        DamageTypes.SLASHING,
        DamageTypes.PIERCING,
        DamageTypes.BLUDGEONING,
      ].includes(damageType)
    ) {
      const reduction = stats.ac || 0;
      finalDamage = Math.max(1, rawOutput - reduction);
    } else if (damageType === DamageTypes.RANGED) {
      const dodgeChance = Math.min(0.5, (stats.agil || 10) * 0.02);
      if (Math.random() < dodgeChance) {
        return { status: "DODGED", damage: 0 };
      }
    } else if (damageType === DamageTypes.PSYCHIC) {
      const mentalBlock = Math.floor((stats.int || 10) / 2);
      finalDamage = Math.max(1, rawOutput - mentalBlock);
    }

    return { status: "HIT", damage: Math.floor(finalDamage) };
  },

  executeClassAction(attacker, defender, targetActionName, classBlueprintData) {
    const classKey = attacker.classKey;
    const classConfig = classBlueprintData[classKey];
    if (!classConfig || !classConfig.progression) {
      return {
        log: `⚠️ Error: Action mapping failed for class layout: "${classKey}".`,
        status: "FAILED",
      };
    }

    let skill = null;
    for (const lvl in classConfig.progression) {
      if (parseInt(lvl, 10) <= attacker.level) {
        const lvlData = classConfig.progression[lvl];

        if (
          lvlData.basicAttack &&
          lvlData.basicAttack.name === targetActionName
        )
          skill = lvlData.basicAttack;
        if (
          lvlData.rangedAttack &&
          lvlData.rangedAttack.name === targetActionName
        )
          skill = lvlData.rangedAttack;
        if (lvlData.spells) {
          const foundSpell = lvlData.spells.find(
            (s) => s.name.toLowerCase() === targetActionName.toLowerCase(),
          );
          if (foundSpell) skill = foundSpell;
        }
      }
    }

    if (!skill) {
      return {
        log: `❌ Action "${targetActionName}" is locked or unknown for class "${classConfig.name}".`,
        status: "FAILED",
      };
    }

    if (skill.cost > 0) {
      const costType = skill.costType === "mp" ? "mp" : "stamina";
      const pool = attacker[costType] || 0;

      if (pool < skill.cost) {
        return {
          log: `❌ ${attacker.name} lacks enough ${costType.toUpperCase()} to use ${skill.name}!`,
          status: "FAILED",
        };
      }
      attacker[costType] -= skill.cost;
    }
    if (skill.isHeal) {
      const rawHeal = this.calculateBaseOutput(
        attacker,
        skill.damageType,
        skill.basePower,
      );
      defender.hp = Math.min(
        defender.maxHp || 100,
        (defender.hp || 0) + rawHeal,
      );
      return {
        log: `✨ ${attacker.name} casts ${skill.name} on ${defender.name} for +${rawHeal} HP!`,
        value: rawHeal,
        status: "SUCCESS",
        type: "HEAL",
      };
    }

    const rawStrike = this.calculateBaseOutput(
      attacker,
      skill.damageType,
      skill.basePower,
    );
    const resolution = this.calculateFinalMitigation(
      rawStrike,
      skill.damageType,
      defender,
    );

    if (resolution.status === "HIT") {
      defender.hp = Math.max(0, (defender.hp || 0) - resolution.damage);
    }

    const costText =
      skill.cost > 0
        ? ` [Cost: ${skill.cost} ${skill.costType.toUpperCase()}]`
        : "";
    return {
      log: `💥 ${attacker.name} uses ${skill.name} on ${defender.name}! Result: ${resolution.damage} [${skill.damageType}] damage (${resolution.status}).${costText}`,
      value: resolution.damage,
      status: resolution.status,
      type: "DAMAGE",
    };
  }, // Safely ends executeClassAction
}; // Safely ends CombatFormulas object

// ==========================================================
// 5. PIPELINE ROUTING FOR ENCOUNTERS
// ==========================================================
export function startEncounter(entity, uiEngineCallbacks = {}) {
  const encType = Array.isArray(entity.encounterType)
    ? entity.encounterType[0]
    : entity.encounterType;

  switch (encType) {
    case "enemy":
      if (uiEngineCallbacks.initiateCombat)
        uiEngineCallbacks.initiateCombat(entity);
      break;
    case "barter window":
      if (uiEngineCallbacks.openShopWindow)
        uiEngineCallbacks.openShopWindow(entity);
      break;
    case "npc dialogue window":
      if (uiEngineCallbacks.openDialogue)
        uiEngineCallbacks.openDialogue(entity);
      break;
    case "hero":
      console.log(`🛡️ Conversing with friendly hero entity: ${entity.name}`);
      break;
    default:
      console.warn(
        `⚠️ Warning: Encounter type "${encType}" has no defined pipeline implementation handler.`,
      );
  }
}
// ==========================================================
// 6. UNIVERSAL DICTIONARY TRANSLATOR
// ==========================================================
export function getKeyByAlias(dataObject, inputAlias) {
  if (!dataObject || !inputAlias) return null;
  const sanitizedInput = inputAlias.toLowerCase().trim();
  for (const [key, value] of Object.entries(dataObject)) {
    if (Array.isArray(value)) {
      const matchFound = value.some(
        (alias) =>
          typeof alias === "string" &&
          alias.toLowerCase().trim() === sanitizedInput,
      );
      if (matchFound) return key;
    } else if (typeof value === "string") {
      if (value.toLowerCase().trim() === sanitizedInput) return key;
    }
  }
  return null;
}
