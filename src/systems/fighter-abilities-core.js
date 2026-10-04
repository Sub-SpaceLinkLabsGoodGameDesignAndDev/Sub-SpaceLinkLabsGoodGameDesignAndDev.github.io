import { calculateProgressiveStaminaCost } from "./fighter-combat-logic.js";

export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const FIGHTER_ABILITY_RANKS = Object.freeze([
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
]);

export const BASH_STUN_CHANCES = Object.freeze(
  FIGHTER_ABILITY_RANKS.map((_, index) => 0.5 + (0.97 - 0.5) * index / 9),
);

export const CONCUSSIVE_RAM_RANKS = Object.freeze([
  Object.freeze({ minimumLevel: 1, staminaCost: 4, cooldownRounds: 0, damageSplit: Object.freeze({ bludgeoning: 6, physical: 4 }) }),
  Object.freeze({ minimumLevel: 6, staminaCost: 5, cooldownRounds: 0, damageSplit: Object.freeze({ bludgeoning: 12, physical: 6 }) }),
  Object.freeze({ minimumLevel: 12, staminaCost: 5, cooldownRounds: 0, damageSplit: Object.freeze({ bludgeoning: 20, physical: 10 }) }),
  Object.freeze({ minimumLevel: 20, staminaCost: 6, cooldownRounds: 4, damageSplit: Object.freeze({ bludgeoning: 32, physical: 14 }) }),
  Object.freeze({ minimumLevel: 30, staminaCost: 0, cooldownRounds: 4, damageSplit: Object.freeze({ bludgeoning: 45, physical: 20 }) }),
  Object.freeze({ minimumLevel: 45, staminaCost: 0, cooldownRounds: 4, damageSplit: Object.freeze({ bludgeoning: 65, physical: 30 }) }),
  Object.freeze({ minimumLevel: 60, staminaCost: 0, cooldownRounds: 3, damageSplit: Object.freeze({ bludgeoning: 90, physical: 45 }) }),
  Object.freeze({ minimumLevel: 75, staminaCost: 0, cooldownRounds: 3, damageSplit: Object.freeze({ bludgeoning: 125, physical: 65 }) }),
  Object.freeze({ minimumLevel: 90, staminaCost: 0, cooldownRounds: 2, damageSplit: Object.freeze({ bludgeoning: 175, physical: 90 }) }),
  Object.freeze({ minimumLevel: 100, staminaCost: 0, cooldownRounds: 1, damageSplit: Object.freeze({ bludgeoning: 250, physical: 140 }) }),
]);

export const TARGET_THREAT_STYLES = Object.freeze([
  Object.freeze({ name: "very-low", color: "#39d353", pulseMilliseconds: 1800 }),
  Object.freeze({ name: "low", color: "#3987ff", pulseMilliseconds: 1500 }),
  Object.freeze({ name: "mid", color: "#ffc928", pulseMilliseconds: 1200 }),
  Object.freeze({ name: "dangerous", color: "#f04444", pulseMilliseconds: 900 }),
  Object.freeze({ name: "critical", color: "#b45cff", pulseMilliseconds: 650 }),
]);

const BASH_BASE_STAMINA_COST = 1;
const MAX_RAM_DISTANCE = 1;
const CARDINAL_DIRECTIONS = Object.freeze({
  N: Object.freeze({ x: 0, y: -1 }),
  E: Object.freeze({ x: 1, y: 0 }),
  S: Object.freeze({ x: 0, y: 1 }),
  W: Object.freeze({ x: -1, y: 0 }),
});

function finiteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function assertRank(rank) {
  if (!Number.isInteger(rank) || rank < 1 || rank > FIGHTER_ABILITY_RANKS.length) {
    throw new RangeError("rank must be an integer from 1 to 10.");
  }
  return rank;
}

function assertRoll(roll, name = "roll") {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError(`${name} must be in the range [0, 1).`);
  }
}

function statValue(entity, stat) {
  if (typeof entity?.getModifiedStat === "function") {
    return finiteNumber(entity.getModifiedStat(stat));
  }
  return finiteNumber(
    entity?.modifiedStats?.[stat] ??
      entity?.stats?.[stat] ??
      entity?.baseStats?.[stat] ??
      entity?.trainedStats?.[stat],
  );
}

function statusName(status) {
  return String(
    typeof status === "string" ? status : status?.id ?? status?.name ?? "",
  ).toUpperCase();
}

function getStatusList(target) {
  if (Array.isArray(target.statusEffects)) {
    return { list: target.statusEffects, key: "statusEffects" };
  }
  if (Array.isArray(target.statuses)) {
    return { list: target.statuses, key: "statuses" };
  }
  return { list: [], key: "statusEffects" };
}

function applyStun(target, rounds) {
  const { list, key } = getStatusList(target);
  const existingIndex = list.findIndex((status) => statusName(status) === "STUNNED");
  const status = { id: "STUNNED", name: "STUNNED", rounds, duration: rounds };

  if (existingIndex === -1) {
    target[key] = [...list, status];
  } else {
    const updated = list.slice();
    updated[existingIndex] =
      typeof list[existingIndex] === "string"
        ? status
        : { ...list[existingIndex], ...status };
    target[key] = updated;
  }
}

function hasEnoughStamina(fighter, amount) {
  return finiteNumber(fighter?.stamina) >= amount;
}

function spendStamina(fighter, amount) {
  fighter.stamina = Math.max(0, Math.round(finiteNumber(fighter.stamina) - amount));
}

function hitChanceFor(fighter, target) {
  const targetEvasion = finiteNumber(
    target?.evasionChance,
    finiteNumber(target?.evasion, 0),
  );
  return Math.min(
    0.95,
    Math.max(
      0.05,
      0.75 +
        (statValue(fighter, "str") - statValue(target, "agil")) * 0.02 -
        targetEvasion,
    ),
  );
}

function getCoordinates(entity) {
  const x = finiteNumber(entity?.x ?? entity?.position?.x, NaN);
  const y = finiteNumber(entity?.y ?? entity?.position?.y, NaN);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function getCardinalDirection(fighter, target) {
  const fighterPosition = getCoordinates(fighter);
  const targetPosition = getCoordinates(target);
  if (fighterPosition && targetPosition) {
    const dx = targetPosition.x - fighterPosition.x;
    const dy = targetPosition.y - fighterPosition.y;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      return dx > 0 ? "E" : "W";
    }
    if (dy !== 0) {
      return dy > 0 ? "S" : "N";
    }
  }

  const facing = String(fighter?.facing ?? "").toUpperCase();
  return Object.prototype.hasOwnProperty.call(CARDINAL_DIRECTIONS, facing)
    ? facing
    : null;
}

function displaceOneCell(fighter, target, distance) {
  const resolvedDistance = Number.isFinite(distance)
    ? distance
    : (() => {
        const fighterPosition = getCoordinates(fighter);
        const targetPosition = getCoordinates(target);
        return fighterPosition && targetPosition
          ? Math.abs(targetPosition.x - fighterPosition.x) +
              Math.abs(targetPosition.y - fighterPosition.y)
          : Infinity;
      })();

  if (resolvedDistance < 0 || resolvedDistance > MAX_RAM_DISTANCE) {
    return { displaced: false, reason: "out-of-range" };
  }

  const direction = getCardinalDirection(fighter, target);
  if (!direction) {
    return { displaced: false, reason: "cardinal-direction-required" };
  }

  const vector = CARDINAL_DIRECTIONS[direction];
  const position = getCoordinates(target) ?? { x: 0, y: 0 };
  const nextPosition = { x: position.x + vector.x, y: position.y + vector.y };
  target.x = nextPosition.x;
  target.y = nextPosition.y;
  if (target.position && typeof target.position === "object") {
    target.position.x = nextPosition.x;
    target.position.y = nextPosition.y;
  }
  target.meleeLocked = false;
  return { displaced: true, direction, position: nextPosition };
}

export function getFighterAbilityRank(rank) {
  return FIGHTER_ABILITY_RANKS[assertRank(rank) - 1];
}

export function getBashStunChance(rank) {
  return BASH_STUN_CHANCES[assertRank(rank) - 1];
}

export function getBashCommandLabel(fighter) {
  const slots = fighter?.equipmentSlots;
  if (slots?.offhand != null) {
    return "Shield Bash";
  }
  if (slots?.weapon?.handsRequired === 2) {
    return "Weapon Bash";
  }
  return "Bash";
}

export function updateBashCommandLabel(fighter, commandNode) {
  const label = getBashCommandLabel(fighter);
  let node = commandNode;
  if (typeof commandNode === "string") {
    if (typeof document === "undefined") {
      throw new TypeError("A DOM is required when commandNode is a selector.");
    }
    node = document.querySelector(commandNode);
  }
  if (!node || !("textContent" in node)) {
    throw new TypeError("commandNode must be a DOM node with a textContent property.");
  }
  node.textContent = label;
  return label;
}

export function executeFighterBash({
  fighter,
  target,
  rank,
  hitRoll = Math.random(),
  stunRoll = Math.random(),
  stunDurationRoll = Math.random(),
  baseStaminaCost = BASH_BASE_STAMINA_COST,
} = {}) {
  assertRank(rank);
  assertRoll(hitRoll, "hitRoll");
  assertRoll(stunRoll, "stunRoll");
  assertRoll(stunDurationRoll, "stunDurationRoll");
  if (!fighter || fighter.classKey !== "fighter" || !target || typeof target !== "object") {
    return { executed: false, reason: "invalid-participants" };
  }
  if (!Number.isInteger(baseStaminaCost) || baseStaminaCost < 0) {
    throw new RangeError("baseStaminaCost must be a non-negative integer.");
  }

  const staminaCost = calculateProgressiveStaminaCost(baseStaminaCost, rank);
  if (!hasEnoughStamina(fighter, staminaCost)) {
    return { executed: false, reason: "insufficient-stamina", staminaCost };
  }

  const chanceToHit = hitChanceFor(fighter, target);
  spendStamina(fighter, staminaCost);
  if (hitRoll >= chanceToHit) {
    return {
      executed: true,
      hit: false,
      rank,
      chanceToHit,
      staminaSpent: staminaCost,
    };
  }

  const stunChance = getBashStunChance(rank);
  let stunRounds = 0;
  if (stunRoll < stunChance) {
    const maximumRounds = 1 + Math.floor(((rank - 1) * 2) / 9);
    stunRounds = 1 + Math.floor(stunDurationRoll * maximumRounds);
    applyStun(target, stunRounds);
  }
  return {
    executed: true,
    hit: true,
    rank,
    chanceToHit,
    stunChance,
    stunned: stunRounds > 0,
    stunRounds,
    staminaSpent: staminaCost,
  };
}

export function calculateConcussiveRamDamage(rank, strength = 0) {
  const profile = CONCUSSIVE_RAM_RANKS[assertRank(rank) - 1];
  if (!Number.isFinite(strength)) {
    throw new TypeError("strength must be a finite number.");
  }
  const multiplier = Math.max(0, 1 + strength * 0.05);
  const damageSplit = Object.fromEntries(
    Object.entries(profile.damageSplit).map(([type, damage]) => [
      type,
      Math.max(0, Math.round(damage * multiplier)),
    ]),
  );
  return {
    damageSplit,
    totalDamage: Object.values(damageSplit).reduce((total, damage) => total + damage, 0),
  };
}

function isLeader(target) {
  return (
    target?.isLeader === true ||
    target?.isCaptain === true ||
    target?.isBoss === true ||
    (Array.isArray(target?.tags) &&
      target.tags.some((tag) => /^(leader|captain|boss)$/i.test(String(tag))))
  );
}

function validateHordeQuadrant(quadrant) {
  if (!quadrant || typeof quadrant !== "object") {
    throw new TypeError("quadrant must be an object.");
  }
  if (
    !Number.isInteger(quadrant.activeFrontRankCount) ||
    quadrant.activeFrontRankCount < 1 ||
    !Number.isInteger(quadrant.reservePoolCount) ||
    quadrant.reservePoolCount < 0
  ) {
    throw new TypeError(
      "quadrant must have non-negative integer activeFrontRankCount and reservePoolCount values.",
    );
  }
}

function applyHordeDisplacement({ quadrant, target, damage }) {
  validateHordeQuadrant(quadrant);

  quadrant.activeFrontRankCount -= 1;
  quadrant.reservePoolCount += 1;
  target.inReserve = true;
  target.isFrontRank = false;
  target.meleeLocked = false;
  const moralePenalty = isLeader(target) ? 10 : 0;
  if (moralePenalty) {
    quadrant.moraleScore = Math.max(0, finiteNumber(quadrant.moraleScore, 100) - moralePenalty);
  }

  const splashDamage = damage * 0.5;
  let reserveCasualties = 0;
  if (Number.isFinite(quadrant.individualHp) && quadrant.individualHp > 0) {
    reserveCasualties = Math.min(
      quadrant.reservePoolCount,
      Math.floor(splashDamage / quadrant.individualHp),
    );
    quadrant.reservePoolCount -= reserveCasualties;
  }
  return {
    displaced: true,
    activeFrontRankCount: quadrant.activeFrontRankCount,
    reservePoolCount: quadrant.reservePoolCount,
    splashDamage,
    reserveCasualties,
    moralePenalty,
  };
}

export function executeConcussiveRam({
  fighter,
  target,
  frontlineTargets = [],
  rank,
  distance,
  currentRound = 0,
  quadrant = null,
  hitRoll = Math.random(),
} = {}) {
  assertRank(rank);
  assertRoll(hitRoll, "hitRoll");
  if (!fighter || fighter.classKey !== "fighter" || !target || typeof target !== "object") {
    return { executed: false, reason: "invalid-participants" };
  }
  if (!Number.isInteger(currentRound) || currentRound < 0) {
    throw new RangeError("currentRound must be a non-negative integer.");
  }

  const profile = CONCUSSIVE_RAM_RANKS[rank - 1];
  if (finiteNumber(fighter.level, 1) < profile.minimumLevel) {
    return {
      executed: false,
      reason: "rank-locked",
      requiredLevel: profile.minimumLevel,
    };
  }
  const readyRound = finiteNumber(fighter.concussiveRamReadyRound);
  if (currentRound < readyRound) {
    return { executed: false, reason: "cooldown", readyRound };
  }
  if (!Array.isArray(frontlineTargets)) {
    throw new TypeError("frontlineTargets must be an array.");
  }
  const affectedTargets = [...new Set([target, ...frontlineTargets])];
  if (affectedTargets.some((frontlineTarget) => !frontlineTarget || typeof frontlineTarget !== "object")) {
    throw new TypeError("frontlineTargets must contain target entities.");
  }
  if (rank >= 5 && quadrant) {
    validateHordeQuadrant(quadrant);
  }
  if (!hasEnoughStamina(fighter, profile.staminaCost)) {
    return {
      executed: false,
      reason: "insufficient-stamina",
      staminaCost: profile.staminaCost,
    };
  }

  const chanceToHit = hitChanceFor(fighter, target);
  spendStamina(fighter, profile.staminaCost);
  if (profile.cooldownRounds > 0) {
    fighter.concussiveRamReadyRound = currentRound + profile.cooldownRounds;
  }
  if (hitRoll >= chanceToHit) {
    return {
      executed: true,
      hit: false,
      rank,
      chanceToHit,
      staminaSpent: profile.staminaCost,
      cooldownRounds: profile.cooldownRounds,
    };
  }

  const damage = calculateConcussiveRamDamage(rank, statValue(fighter, "str"));
  const resolvedTargets = rank >= 5 ? affectedTargets : [target];
  for (const affectedTarget of resolvedTargets) {
    if (typeof affectedTarget.hp === "number" && Number.isFinite(affectedTarget.hp)) {
      affectedTarget.hp = Math.max(0, affectedTarget.hp - damage.totalDamage);
    }
  }

  let displacement;
  if (rank >= 5 && quadrant) {
    displacement = applyHordeDisplacement({
      quadrant,
      target,
      damage: damage.totalDamage,
    });
  } else {
    displacement = displaceOneCell(fighter, target, distance);
  }

  return {
    executed: true,
    hit: true,
    rank,
    chanceToHit,
    damageSplit: damage.damageSplit,
    totalDamage: damage.totalDamage,
    staminaSpent: profile.staminaCost,
    cooldownRounds: profile.cooldownRounds,
    affectedTargets: resolvedTargets.length,
    displacement,
  };
}

export function handleFighterAbilityInput({
  fighter,
  target,
  ability,
  rank,
  commandNode,
  ...options
} = {}) {
  const commandLabel = commandNode
    ? updateBashCommandLabel(fighter, commandNode)
    : getBashCommandLabel(fighter);
  if (ability === "bash") {
    return {
      commandLabel,
      ...executeFighterBash({ fighter, target, rank, ...options }),
    };
  }
  if (ability === "concussive-ram") {
    return {
      commandLabel,
      ...executeConcussiveRam({ fighter, target, rank, ...options }),
    };
  }
  return { executed: false, reason: "unknown-ability", commandLabel };
}

export function getTargetThreatStyle(threatIndex) {
  if (!Number.isInteger(threatIndex) || threatIndex < 0 || threatIndex >= TARGET_THREAT_STYLES.length) {
    throw new RangeError("threatIndex must be an integer from 0 to 4.");
  }
  return TARGET_THREAT_STYLES[threatIndex];
}

export function updateTacticalTargetingRing(ring, threatIndex) {
  if (!ring || !ring.style || typeof ring.style !== "object") {
    throw new TypeError("ring must be an element with a style object.");
  }
  const threat = getTargetThreatStyle(threatIndex);
  ring.dataset.threatIndex = String(threatIndex);
  ring.dataset.threatName = threat.name;
  ring.style.setProperty("--threat-color", threat.color);
  ring.style.color = threat.color;
  ring.style.borderColor = threat.color;
  ring.style.boxShadow = `0 0 12px ${threat.color}`;
  ring.style.animationDuration = `${threat.pulseMilliseconds}ms`;
  return threat;
}