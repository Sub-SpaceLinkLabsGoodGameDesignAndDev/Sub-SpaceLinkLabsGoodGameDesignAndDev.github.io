const DAMAGE_SCALING = Object.freeze({
  physical: Object.freeze({ stat: "str", coefficient: 0.05 }),
  slashing: Object.freeze({ stat: "str", coefficient: 0.05 }),
  piercing: Object.freeze({ stat: "str", coefficient: 0.05 }),
  bludgeoning: Object.freeze({ stat: "str", coefficient: 0.05 }),
  ranged: Object.freeze({ stat: "dex", coefficient: 0.05 }),
  fire: Object.freeze({ stat: "int", coefficient: 0.07 }),
  cold: Object.freeze({ stat: "int", coefficient: 0.07 }),
  lightning: Object.freeze({ stat: "int", coefficient: 0.07 }),
  poison: Object.freeze({ stat: "int", coefficient: 0.07 }),
  magic: Object.freeze({ stat: "int", coefficient: 0.07 }),
  arcane: Object.freeze({ stat: "int", coefficient: 0.07 }),
  divine: Object.freeze({ stat: "wis", coefficient: 0.06 }),
  necrotic: Object.freeze({ stat: "wis", coefficient: 0.06 }),
  radiant: Object.freeze({ stat: "wis", coefficient: 0.06 }),
  psychic: Object.freeze({ stat: "char", coefficient: 0.05 }),
});

const PHYSICAL_DAMAGE_TYPES = new Set([
  "physical",
  "slashing",
  "piercing",
  "bludgeoning",
  "ranged",
]);

function finiteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStat(entity, stat) {
  if (typeof entity?.getModifiedStat === "function") {
    return finiteNumber(entity.getModifiedStat(stat));
  }
  return finiteNumber(
    entity?.stats?.[stat] ??
      entity?.modifiedStats?.[stat] ??
      entity?.baseStats?.[stat],
  );
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getAction(actor, actionName, classData) {
  if (actionName === "Melee Attack") {
    return classData?.[actor.classKey]?.progression?.[1]?.basicAttack ?? null;
  }

  const slottedAction = actor.spellbook?.find(
    (spell) => spell.name === actionName,
  );
  if (slottedAction) return slottedAction;

  for (const levelActions of Object.values(
    classData?.[actor.classKey]?.progression ?? {},
  )) {
    const action = levelActions.spells?.find(
      (spell) => spell.name === actionName,
    );
    if (action) return action;
  }
  return null;
}

function resolveDamageSplit(action) {
  if (action.damageSplit && typeof action.damageSplit === "object") {
    return action.damageSplit;
  }
  if (typeof action.damageType === "string") {
    return { [action.damageType]: finiteNumber(action.basePower) };
  }
  return {};
}

function targetArmorClass(target) {
  if (target.statusEffects?.includes("MEDITATING_EXPOSED")) return 0;
  if (typeof target.getTotalAc === "function") return target.getTotalAc();
  return getStat(target, "ac");
}

function damageResistance(target, damageType) {
  const type = damageType.toLowerCase();
  const immunities = target.invulnerabilities ?? target.immunitiesDamage ?? [];
  if (Array.isArray(immunities) && immunities.includes(type)) return 0;

  const vulnerability = target.vulnerabilities?.[type];
  if (typeof vulnerability === "number" && Number.isFinite(vulnerability)) {
    return vulnerability;
  }
  const resistance = target.resistances?.[type];
  if (typeof resistance === "number" && Number.isFinite(resistance)) {
    return resistance;
  }
  return 1;
}

export function calculateStatScaling(actor, damageType) {
  const scaling = DAMAGE_SCALING[String(damageType).toLowerCase()];
  return scaling
    ? getStat(actor, scaling.stat) * scaling.coefficient
    : 0;
}

export function calculateBaseDamage(actor, action) {
  if (!actor || typeof actor !== "object") {
    throw new TypeError("An attacking entity is required.");
  }
  if (!action || typeof action !== "object" || Array.isArray(action)) {
    throw new TypeError("An action definition is required.");
  }

  const scaledSplit = {};
  for (const [damageType, baseDamage] of Object.entries(
    resolveDamageSplit(action),
  )) {
    if (typeof baseDamage !== "number" || !Number.isFinite(baseDamage)) {
      throw new TypeError(`Damage split ${damageType} must be finite.`);
    }
    const multiplier = 1 + calculateStatScaling(actor, damageType);
    scaledSplit[damageType] = baseDamage * multiplier;
  }
  return scaledSplit;
}

export function calculateHitChance(actor, target, action) {
  const baseAccuracy = finiteNumber(action?.accuracy, 0.9);
  const levelAdjustment =
    (finiteNumber(actor?.level, 1) - finiteNumber(target?.level, 1)) * 0.005;
  const accuracyStat = Math.max(
    getStat(actor, "dex"),
    getStat(actor, "int"),
    getStat(actor, "wis"),
  );
  const evasion = getStat(target, "agil") * 0.01;
  return clamp(baseAccuracy + levelAdjustment + accuracyStat * 0.005 - evasion, 0.05, 1);
}

export function calculateFinalMitigation(baseDamage, damageType, target) {
  if (typeof baseDamage !== "number" || !Number.isFinite(baseDamage)) {
    throw new TypeError("baseDamage must be a finite number.");
  }
  if (typeof damageType !== "string" || damageType.length === 0) {
    throw new TypeError("damageType must be a non-empty string.");
  }
  if (!target || typeof target !== "object") {
    throw new TypeError("A defending entity is required.");
  }

  const type = damageType.toLowerCase();
  const resistance = damageResistance(target, type);
  if (resistance === 0 || baseDamage <= 0) {
    return { damage: 0, resistance };
  }
  let damage = baseDamage * resistance;
  if (PHYSICAL_DAMAGE_TYPES.has(type)) {
    let armorClass = Math.max(0, targetArmorClass(target));
    if (target.activeStance === "BULWARK") armorClass += 15;
    if (target.activeStance === "DEFENSIVE") armorClass *= 1.2;
    damage = Math.max(0, damage - armorClass);
  }

  return { damage: Math.max(1, Math.floor(damage)), resistance };
}

export const CombatFormulas = Object.freeze({
  calculateStatScaling,
  calculateBaseDamage,
  calculateHitChance,
  calculateFinalMitigation,
  executeClassAction(actor, target, actionName, classData) {
    if (!actor || !target) {
      return { status: "FAILED", value: 0, log: "Action requires an actor and target." };
    }
    const action = getAction(actor, actionName, classData);
    if (!action) {
      return {
        status: "FAILED",
        value: 0,
        log: `${actor.name} cannot use ${actionName}.`,
      };
    }

    const resourceName = action.costType === "mp" ? "mp" : "stamina";
    const cost = Math.max(0, finiteNumber(action.cost));
    if (finiteNumber(actor[resourceName]) < cost) {
      return {
        status: "FAILED",
        value: 0,
        log: `${actor.name} does not have enough ${resourceName.toUpperCase()}.`,
      };
    }

    const hitChance = calculateHitChance(actor, target, action);
    if (Math.random() >= hitChance) {
      actor[resourceName] = Math.max(0, finiteNumber(actor[resourceName]) - cost);
      return {
        status: "MISS",
        value: 0,
        hitChance,
        log: `${actor.name}'s ${actionName} misses ${target.name}.`,
      };
    }

    actor[resourceName] = Math.max(0, finiteNumber(actor[resourceName]) - cost);
    const scaledSplit = calculateBaseDamage(actor, action);
    const varianceMultiplier = 0.85 + Math.random() * 0.3;
    let physicalDamage = 0;
    let otherDamage = 0;
    let healing = 0;

    for (const [damageType, segment] of Object.entries(scaledSplit)) {
      const variedSegment = segment * varianceMultiplier;
      if (variedSegment < 0) {
        healing += Math.abs(variedSegment);
      } else if (PHYSICAL_DAMAGE_TYPES.has(damageType.toLowerCase())) {
        physicalDamage += variedSegment * damageResistance(target, damageType);
      } else {
        otherDamage += variedSegment * damageResistance(target, damageType);
      }
    }

    if (actor.classKey === "fighter" && actor.activeStance === "AGGRESSIVE") {
      physicalDamage *= 1.2;
    }
    const armorClass =
      target.activeStance === "BULWARK"
        ? targetArmorClass(target) + 15
        : target.activeStance === "DEFENSIVE"
          ? targetArmorClass(target) * 1.2
          : targetArmorClass(target);
    const appliedPhysical = Math.max(0, physicalDamage - armorClass);
    const totalDamage = Math.floor(appliedPhysical + otherDamage);
    const appliedHealing = Math.floor(healing);
    const value =
      totalDamage > 0
        ? Math.max(1, totalDamage)
        : physicalDamage + otherDamage > 0
          ? 1
          : 0;

    if (value > 0) {
      target.hp = Math.max(0, finiteNumber(target.hp) - value);
    } else if (appliedHealing > 0) {
      target.hp = Math.min(
        finiteNumber(target.maxHp, finiteNumber(target.hp)),
        finiteNumber(target.hp) + appliedHealing,
      );
    }

    const resultValue = value > 0 ? value : -appliedHealing;
    const log =
      value > 0
        ? `${actor.name} uses ${actionName} on ${target.name} for ${value} damage.`
        : appliedHealing > 0
          ? `${actor.name} uses ${actionName} on ${target.name}, restoring ${appliedHealing} HP.`
          : `${actor.name} uses ${actionName} on ${target.name}.`;
    return {
      status: value > 0 ? "HIT" : "SUCCESS",
      value: resultValue,
      damage: value,
      healing: appliedHealing,
      hitChance,
      damageSplit: scaledSplit,
      log,
    };
  },
});