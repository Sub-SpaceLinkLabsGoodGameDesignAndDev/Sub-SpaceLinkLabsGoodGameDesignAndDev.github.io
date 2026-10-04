export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const FIGHTER_STANCES = Object.freeze([
  "BALANCED",
  "BULWARK",
  "RETALIATORY",
  "AGGRESSIVE",
  "DEFENSIVE",
]);

export const STANCE_REQUIREMENTS = Object.freeze({
  BALANCED: Object.freeze({ minimumLevel: 1, staminaCost: 0 }),
  BULWARK: Object.freeze({ minimumLevel: 30, staminaCost: 0 }),
  RETALIATORY: Object.freeze({ minimumLevel: 15, staminaCost: 0 }),
  AGGRESSIVE: Object.freeze({ minimumLevel: 1, staminaCost: 2 }),
  DEFENSIVE: Object.freeze({ minimumLevel: 1, staminaCost: 2 }),
});

export const FIELD_MEDIC_RANKS = Object.freeze([
  Object.freeze({ rank: 1, minimumLevel: 1, staminaCost: 4, dailyCharges: 2, lowHpPercent: 20, restorePercent: 40, poisonPurgeChance: 0, mentalPurgeChance: 0, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 2, minimumLevel: 6, staminaCost: 5, dailyCharges: 2, lowHpPercent: 22, restorePercent: 43, poisonPurgeChance: 0, mentalPurgeChance: 0, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 3, minimumLevel: 12, staminaCost: 5, dailyCharges: 2, lowHpPercent: 24, restorePercent: 47, poisonPurgeChance: 0, mentalPurgeChance: 0, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 4, minimumLevel: 20, staminaCost: 6, dailyCharges: 3, lowHpPercent: 26, restorePercent: 51, poisonPurgeChance: 0, mentalPurgeChance: 0, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 5, minimumLevel: 30, staminaCost: 6, dailyCharges: 3, lowHpPercent: 28, restorePercent: 55, poisonPurgeChance: 0.45, mentalPurgeChance: 0, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 6, minimumLevel: 45, staminaCost: 7, dailyCharges: 3, lowHpPercent: 30, restorePercent: 59, poisonPurgeChance: 0.55, mentalPurgeChance: 0, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 7, minimumLevel: 60, staminaCost: 0, dailyCharges: Infinity, cooldownRounds: 4, lowHpPercent: 32, restorePercent: 63, poisonPurgeChance: 0.55, mentalPurgeChance: 0.5, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 8, minimumLevel: 75, staminaCost: 0, dailyCharges: Infinity, cooldownRounds: 4, lowHpPercent: 33, restorePercent: 67, poisonPurgeChance: 0.55, mentalPurgeChance: 1, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 9, minimumLevel: 90, staminaCost: 0, dailyCharges: Infinity, cooldownRounds: 3, lowHpPercent: 34, restorePercent: 71, poisonPurgeChance: 0.75, mentalPurgeChance: 1, advancedCursePurgeChance: 0 }),
  Object.freeze({ rank: 10, minimumLevel: 100, staminaCost: 0, dailyCharges: Infinity, cooldownRounds: 2, lowHpPercent: 35, restorePercent: 75, poisonPurgeChance: 1, mentalPurgeChance: 1, advancedCursePurgeChance: 0.01 }),
]);

export const PHYSICAL_DAMAGE_TYPES = Object.freeze([
  "physical",
  "slashing",
  "piercing",
  "bludgeoning",
  "ranged",
]);
export const TRIAGE_PURGE_STATUSES = Object.freeze([
  "BLEEDING",
  "POISONED",
  "MESMERIZED",
  "CONFUSED",
]);
export const ADVANCED_CURSE_STATUSES = Object.freeze(["NECROTIC_CURSE"]);

const RETALIATION_VARIANCE = Object.freeze({ minimum: 0.45, maximum: 0.85 });
const DEFENSIVE_VARIANCE = Object.freeze({ minimum: 0.6, maximum: 0.9 });
const exhaustedCounts = new WeakMap();

function finiteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function statValue(character, stat) {
  if (typeof character?.getModifiedStat === "function") {
    return finiteNumber(character.getModifiedStat(stat));
  }
  return finiteNumber(
    character?.modifiedStats?.[stat] ??
      character?.stats?.[stat] ??
      character?.baseStats?.[stat],
  );
}

function normalizeStance(stance) {
  const normalized = String(stance ?? "BALANCED").toUpperCase();
  return FIGHTER_STANCES.includes(normalized) ? normalized : "BALANCED";
}

function maxStamina(character) {
  return Math.max(
    0,
    finiteNumber(character?.maxStamina, finiteNumber(character?.stamina)),
  );
}

function hasStamina(character, amount) {
  return finiteNumber(character?.stamina) >= amount;
}

function setStamina(character, amount) {
  character.stamina = Math.max(0, Math.round(amount));
}

export function getStanceModifiers(character) {
  const stance =
    character?.classKey === "fighter"
      ? normalizeStance(character.activeStance)
      : "BALANCED";

  switch (stance) {
    case "BULWARK":
      return Object.freeze({
        stance,
        armorClassFlat: 15,
        armorClassMultiplier: 1,
        parryChance: 0.1,
        evasionModifier: -0.1,
        incomingPhysicalDamageMultiplier: 1,
        meleeDamageMultiplier: 1,
        swingVariance: null,
      });
    case "RETALIATORY":
      return Object.freeze({
        stance,
        armorClassFlat: 0,
        armorClassMultiplier: 1,
        parryChance: 0,
        evasionModifier: -0.1,
        incomingPhysicalDamageMultiplier: 1,
        meleeDamageMultiplier: 1,
        swingVariance: RETALIATION_VARIANCE,
      });
    case "AGGRESSIVE":
      return Object.freeze({
        stance,
        armorClassFlat: 0,
        armorClassMultiplier: Math.max(0, 1 - 0.15),
        parryChance: 0,
        evasionModifier: 0,
        incomingPhysicalDamageMultiplier: 1,
        meleeDamageMultiplier: 1.2,
        swingVariance: null,
      });
    case "DEFENSIVE":
      return Object.freeze({
        stance,
        armorClassFlat: 0,
        armorClassMultiplier: 1.2,
        parryChance: 0,
        evasionModifier: 0,
        incomingPhysicalDamageMultiplier: 1,
        meleeDamageMultiplier: 1,
        swingVariance: DEFENSIVE_VARIANCE,
      });
    default:
      return Object.freeze({
        stance: "BALANCED",
        armorClassFlat: 0,
        armorClassMultiplier: 1,
        parryChance: 0,
        evasionModifier: 0,
        incomingPhysicalDamageMultiplier: 1,
        meleeDamageMultiplier: 1,
        swingVariance: null,
      });
  }
}

export function activateFighterStance(character, stance) {
  if (!character || character.classKey !== "fighter") {
    return { activated: false, reason: "not-fighter" };
  }

  const nextStance = String(stance ?? "").toUpperCase();
  if (!FIGHTER_STANCES.includes(nextStance)) {
    return { activated: false, reason: "invalid-stance" };
  }

  const requirement = STANCE_REQUIREMENTS[nextStance];
  const level = Math.max(1, Math.floor(finiteNumber(character.level, 1)));
  if (level < requirement.minimumLevel) {
    return {
      activated: false,
      reason: "level-requirement",
      requiredLevel: requirement.minimumLevel,
    };
  }
  if (!hasStamina(character, requirement.staminaCost)) {
    return { activated: false, reason: "insufficient-stamina" };
  }

  const previousStance = normalizeStance(character.activeStance);
  if (previousStance === nextStance) {
    return { activated: true, changed: false, stance: nextStance };
  }

  character.activeStance = "";
  if (requirement.staminaCost > 0) {
    setStamina(character, character.stamina - requirement.staminaCost);
  }
  character.activeStance = nextStance;

  return {
    activated: true,
    changed: true,
    previousStance,
    stance: nextStance,
    staminaSpent: requirement.staminaCost,
    modifiers: getStanceModifiers(character),
  };
}

export function calculateStanceArmorClass(character, baseArmorClass) {
  const modifiers = getStanceModifiers(character);
  const base = finiteNumber(baseArmorClass);
  return Math.max(
    0,
    Math.round(base * modifiers.armorClassMultiplier + modifiers.armorClassFlat),
  );
}

export function calculateEvasionChance(character, baseEvasionChance) {
  return clamp(
    finiteNumber(baseEvasionChance) +
      getStanceModifiers(character).evasionModifier,
    0,
    1,
  );
}

export function calculateParryChance(character, baseParryChance) {
  return clamp(
    finiteNumber(baseParryChance) + getStanceModifiers(character).parryChance,
    0,
    1,
  );
}

export function resolveStanceDamage({
  character,
  damageSplit,
  varianceRoll = Math.random(),
  retaliation = false,
} = {}) {
  if (!damageSplit || typeof damageSplit !== "object" || Array.isArray(damageSplit)) {
    throw new TypeError("damageSplit must be an object of damage values.");
  }
  if (!Number.isFinite(varianceRoll) || varianceRoll < 0 || varianceRoll >= 1) {
    throw new RangeError("varianceRoll must be in the range [0, 1).");
  }

  const stance = getStanceModifiers(character);
  const variance =
    retaliation
      ? RETALIATION_VARIANCE
      : stance.swingVariance;
  const multiplier = variance
    ? variance.minimum + varianceRoll * (variance.maximum - variance.minimum)
    : 1;
  const split = {};
  let total = 0;

  for (const [type, rawDamage] of Object.entries(damageSplit)) {
    if (typeof rawDamage !== "number" || !Number.isFinite(rawDamage)) {
      throw new TypeError(`damageSplit.${type} must be a finite number.`);
    }
    const stanceMultiplier =
      character?.classKey === "fighter" &&
      stance.stance === "AGGRESSIVE"
        ? stance.meleeDamageMultiplier
        : 1;
    const resolved = Math.max(
      0,
      Math.round(rawDamage * multiplier * stanceMultiplier),
    );
    split[type] = resolved;
    total += resolved;
  }

  return { split, total: Math.round(total), varianceMultiplier: multiplier };
}

export function attemptBulwarkInterception({
  fighter,
  target,
  damageSplit,
  roll = Math.random(),
} = {}) {
  if (!fighter || fighter.classKey !== "fighter" || !target) {
    return { intercepted: false, reason: "invalid-participants" };
  }
  if (normalizeStance(fighter.activeStance) !== "BULWARK") {
    return { intercepted: false, reason: "stance-inactive" };
  }
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError("roll must be in the range [0, 1).");
  }

  const targetRank = finiteNumber(target.rank ?? target.row);
  const targetIsRearCaster =
    target.rankName === "rear" ||
    target.isRearRankCaster === true ||
    targetRank === 3 ||
    targetRank === 4;
  if (!targetIsRearCaster) {
    return { intercepted: false, reason: "target-not-rear-rank" };
  }
  if (
    !damageSplit ||
    typeof damageSplit !== "object" ||
    Array.isArray(damageSplit)
  ) {
    throw new TypeError("damageSplit must be an object of damage values.");
  }

  const physicalDamage = {};
  let totalPhysicalDamage = 0;
  for (const [type, rawDamage] of Object.entries(damageSplit)) {
    if (typeof rawDamage !== "number" || !Number.isFinite(rawDamage)) {
      throw new TypeError(`damageSplit.${type} must be a finite number.`);
    }
    if (PHYSICAL_DAMAGE_TYPES.includes(type.toLowerCase())) {
      const damage = Math.max(0, Math.round(rawDamage));
      physicalDamage[type] = damage;
      totalPhysicalDamage += damage;
    }
  }
  if (totalPhysicalDamage === 0 || roll >= 0.25) {
    return { intercepted: false, reason: "intercept-roll-failed" };
  }
  if (!hasStamina(fighter, 2)) {
    return { intercepted: false, reason: "insufficient-stamina" };
  }

  setStamina(fighter, fighter.stamina - 2);
  return {
    intercepted: true,
    redirectTo: fighter,
    damageSplit: physicalDamage,
    totalDamage: totalPhysicalDamage,
    staminaSpent: 2,
  };
}

export function createRetaliationStrike({
  fighter,
  ally,
  attacker,
  roll = Math.random(),
  basicMeleeAction,
} = {}) {
  if (
    !fighter ||
    fighter.classKey !== "fighter" ||
    !ally ||
    ally === fighter ||
    !attacker
  ) {
    return { triggered: false, reason: "invalid-participants" };
  }
  if (normalizeStance(fighter.activeStance) !== "RETALIATORY") {
    return { triggered: false, reason: "stance-inactive" };
  }
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError("roll must be in the range [0, 1).");
  }

  const chance = Math.min(0.5, Math.max(0, statValue(fighter, "agil") * 0.04));
  if (roll >= chance) {
    return { triggered: false, reason: "retaliation-roll-failed", chance };
  }
  if (!hasStamina(fighter, 1)) {
    return { triggered: false, reason: "insufficient-stamina", chance };
  }
  if (typeof basicMeleeAction !== "function") {
    throw new TypeError("basicMeleeAction must resolve a basic melee strike.");
  }

  setStamina(fighter, fighter.stamina - 1);
  return {
    triggered: true,
    chance,
    staminaSpent: 1,
    action: {
      kind: "fighter-retaliation",
      actor: fighter,
      target: attacker,
      outOfTurn: true,
      variance: RETALIATION_VARIANCE,
      resolve: () => basicMeleeAction(fighter, attacker, {
        outOfTurn: true,
        variance: RETALIATION_VARIANCE,
      }),
    },
  };
}

export function queueRetaliationStrike({
  queue,
  currentIndex = -1,
  ...strikeOptions
} = {}) {
  if (!Array.isArray(queue)) {
    throw new TypeError("combat queue must be an array.");
  }
  const result = createRetaliationStrike(strikeOptions);
  if (!result.triggered) {
    return result;
  }

  const queued = enqueueOutOfTurnAction(
    queue,
    result.action,
    currentIndex,
  );
  return { ...result, ...queued };
}

export function enqueueOutOfTurnAction(queue, action, currentIndex = -1) {
  if (!Array.isArray(queue)) {
    throw new TypeError("combat queue must be an array.");
  }
  if (!action || typeof action !== "object" || action.outOfTurn !== true) {
    throw new TypeError("An out-of-turn action record is required.");
  }
  if (!Number.isInteger(currentIndex) || currentIndex < -1) {
    throw new RangeError("currentIndex must be an integer greater than or equal to -1.");
  }

  const insertionIndex = Math.min(queue.length, currentIndex + 1);
  queue.splice(insertionIndex, 0, action);
  return { queue, insertionIndex, currentIndex };
}

export function calculateProgressiveStaminaCost(baseCost, rank) {
  if (!Number.isInteger(baseCost) || baseCost < 0) {
    throw new RangeError("baseCost must be a non-negative integer.");
  }
  if (!Number.isInteger(rank) || rank < 1 || rank > 10) {
    throw new RangeError("rank must be an integer from 1 to 10.");
  }
  return baseCost === 0 ? 0 : baseCost + rank - 1;
}

export function recordExhaustedCompanions(
  partyMembers,
  tracker = { localizedCommotionPenalty: 0 },
) {
  if (!Array.isArray(partyMembers)) {
    throw new TypeError("partyMembers must be an array.");
  }
  if (!tracker || typeof tracker !== "object") {
    throw new TypeError("tracker must be an object.");
  }

  const activeMembers = partyMembers.filter(
    (member) =>
      member &&
      typeof member === "object" &&
      !(finiteNumber(member.hp, 1) <= 0),
  );
  const exhaustedCount = activeMembers.filter(
    (member) => finiteNumber(member.stamina) <= 0,
  ).length;
  const priorCount = exhaustedCounts.get(tracker) ?? 0;
  tracker.exhaustedHeads = exhaustedCount;
  tracker.localizedCommotionPenalty =
    Math.max(0, finiteNumber(tracker.localizedCommotionPenalty)) +
    Math.max(0, exhaustedCount - priorCount) * 0.15;
  tracker.encounterNoiseMultiplier = 1 + tracker.localizedCommotionPenalty;
  exhaustedCounts.set(tracker, exhaustedCount);
  return tracker;
}

export function isVanguardMobilityBlocked(partyMembers) {
  if (!Array.isArray(partyMembers)) {
    throw new TypeError("partyMembers must be an array.");
  }

  const living = partyMembers.filter(
    (member) =>
      member &&
      typeof member === "object" &&
      !(finiteNumber(member.hp, 1) <= 0),
  );
  if (living.length === 0) {
    return true;
  }

  const maxPool = living.reduce(
    (total, member) => total + maxStamina(member),
    0,
  );
  const currentPool = living.reduce(
    (total, member) => total + Math.max(0, finiteNumber(member.stamina)),
    0,
  );
  return maxPool <= 0 || currentPool / maxPool < 0.1;
}

export function getFieldMedicRank(rank) {
  if (!Number.isInteger(rank) || rank < 1 || rank > FIELD_MEDIC_RANKS.length) {
    throw new RangeError("Field Medic rank must be an integer from 1 to 10.");
  }
  return FIELD_MEDIC_RANKS[rank - 1];
}

export function canUseFieldMedic({
  fighter,
  target,
  rank,
  dayKey = 0,
  currentRound = 0,
} = {}) {
  const profile = getFieldMedicRank(rank);
  if (!fighter || fighter.classKey !== "fighter" || !target) {
    return { allowed: false, reason: "invalid-participants", profile };
  }
  if (finiteNumber(fighter.level, 1) < profile.minimumLevel) {
    return { allowed: false, reason: "rank-locked", profile };
  }

  const maxHp = finiteNumber(target.maxHp);
  const hp = finiteNumber(target.hp);
  if (maxHp <= 0 || hp < 0 || hp / maxHp > profile.lowHpPercent / 100) {
    return { allowed: false, reason: "target-above-low-hp-threshold", profile };
  }

  if (!hasStamina(fighter, profile.staminaCost)) {
    return { allowed: false, reason: "insufficient-stamina", profile };
  }

  if (Number.isFinite(profile.cooldownRounds)) {
    const readyRound = finiteNumber(fighter.fieldMedicReadyRound, 0);
    if (currentRound < readyRound) {
      return {
        allowed: false,
        reason: "cooldown",
        readyRound,
        profile,
      };
    }
  } else {
    const usage =
      fighter.fieldMedicDailyUsage?.dayKey === dayKey
        ? finiteNumber(fighter.fieldMedicDailyUsage.count)
        : 0;
    if (usage >= profile.dailyCharges) {
      return { allowed: false, reason: "daily-charge-limit", profile };
    }
  }

  return { allowed: true, profile };
}

function normalizeStatuses(target) {
  if (Array.isArray(target.statusEffects)) {
    return {
      list: target.statusEffects,
      replace(statuses) {
        target.statusEffects = statuses;
      },
    };
  }
  if (Array.isArray(target.statuses)) {
    return {
      list: target.statuses,
      replace(statuses) {
        target.statuses = statuses;
      },
    };
  }
  return {
    list: [],
    replace(statuses) {
      target.statusEffects = statuses;
    },
  };
}

function statusName(status) {
  return String(
    typeof status === "string" ? status : status?.id ?? status?.name ?? "",
  ).toUpperCase();
}

export function resolveFieldMedic({
  fighter,
  target,
  rank,
  dayKey = 0,
  currentRound = 0,
  random = Math.random,
} = {}) {
  const eligibility = canUseFieldMedic({
    fighter,
    target,
    rank,
    dayKey,
    currentRound,
  });
  if (!eligibility.allowed) {
    return eligibility;
  }
  if (typeof random !== "function") {
    throw new TypeError("random must be a function returning values in [0, 1).");
  }

  const profile = eligibility.profile;
  const normalizedStatuses = normalizeStatuses(target);
  const retainedStatuses = [];
  const removedStatuses = [];
  for (const status of normalizedStatuses.list) {
    const name = statusName(status);
    if (name === "BLEEDING") {
      removedStatuses.push(name);
      continue;
    }
    if (
      name === "NECROTIC_CURSE" &&
      profile.advancedCursePurgeChance > 0
    ) {
      const roll = random();
      if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
        throw new RangeError("random() must return a value in the range [0, 1).");
      }
      if (roll < profile.advancedCursePurgeChance) {
        removedStatuses.push(name);
        continue;
      }
    }
    if (
      name === "POISONED" &&
      profile.poisonPurgeChance > 0
    ) {
      const roll = random();
      if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
        throw new RangeError("random() must return a value in the range [0, 1).");
      }
      if (roll < profile.poisonPurgeChance) {
        removedStatuses.push(name);
        continue;
      }
    }
    if (
      (name === "MESMERIZED" || name === "CONFUSED") &&
      profile.mentalPurgeChance > 0
    ) {
      const roll = random();
      if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
        throw new RangeError("random() must return a value in the range [0, 1).");
      }
      if (roll < profile.mentalPurgeChance) {
        removedStatuses.push(name);
        continue;
      }
    }
    retainedStatuses.push(status);
  }

  const updatedHp = Math.min(
    finiteNumber(target.maxHp),
    Math.round(finiteNumber(target.maxHp) * profile.restorePercent / 100),
  );
  setStamina(fighter, fighter.stamina - profile.staminaCost);
  target.hp = updatedHp;
  normalizedStatuses.replace(retainedStatuses);

  if (Number.isFinite(profile.cooldownRounds)) {
    fighter.fieldMedicReadyRound = currentRound + profile.cooldownRounds;
  } else {
    const usage =
      fighter.fieldMedicDailyUsage?.dayKey === dayKey
        ? finiteNumber(fighter.fieldMedicDailyUsage.count)
        : 0;
    fighter.fieldMedicDailyUsage = {
      dayKey,
      count: usage + 1,
    };
  }

  return {
    resolved: true,
    rank,
    manaSpent: 0,
    staminaSpent: profile.staminaCost,
    hp: target.hp,
    removedStatuses,
    retainedStatuses,
  };
}