export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const PAPERDOLL_SLOTS = Object.freeze([
  "weapon",
  "offhand",
  "head",
  "chest",
  "legs",
  "feet",
  "hands",
  "shoulders",
  "waist",
  "neck",
  "ring1",
  "ring2",
  "trinket1",
  "trinket2",
  "ammo",
  "back",
]);

const DEFAULT_BASE_STATS = Object.freeze({ sta: 5 });

function normalizeStats(stats, name) {
  if (stats == null) {
    return {};
  }
  if (typeof stats !== "object" || Array.isArray(stats)) {
    throw new TypeError(`${name} must be an object of numeric modifiers.`);
  }

  const normalized = {};
  for (const [key, value] of Object.entries(stats)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`${name}.${key} must be a finite number.`);
    }
    normalized[key] = value;
  }
  return normalized;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeEquipmentSlots(slots) {
  const normalized = Object.fromEntries(PAPERDOLL_SLOTS.map((slot) => [slot, null]));

  if (slots == null) {
    return normalized;
  }

  if (Array.isArray(slots)) {
    if (slots.length !== PAPERDOLL_SLOTS.length) {
      throw new RangeError(
        `equipmentSlots must contain exactly ${PAPERDOLL_SLOTS.length} slots.`,
      );
    }
    for (const [index, slot] of PAPERDOLL_SLOTS.entries()) {
      normalized[slot] = slots[index] ?? null;
    }
    return normalized;
  }

  if (typeof slots !== "object") {
    throw new TypeError("equipmentSlots must be a slot map or 16-slot array.");
  }

  for (const [slot, item] of Object.entries(slots)) {
    if (!hasOwn(normalized, slot)) {
      throw new RangeError(`Unknown paperdoll slot: ${slot}.`);
    }
    normalized[slot] = item ?? null;
  }
  return normalized;
}

function modifierValue(modifiers, stat) {
  const value = modifiers?.[stat];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeEffect(effect, index) {
  if (!effect || typeof effect !== "object" || Array.isArray(effect)) {
    throw new TypeError(`activeEffects[${index}] must be an effect object.`);
  }

  const sourceId = effect.sourceId ?? effect.id;
  if (typeof sourceId !== "string" || sourceId.trim().length === 0) {
    throw new TypeError(
      `activeEffects[${index}].sourceId must be a non-empty string.`,
    );
  }

  for (const field of ["hpBonus", "hpPercent"]) {
    if (
      effect[field] !== undefined &&
      (typeof effect[field] !== "number" || !Number.isFinite(effect[field]))
    ) {
      throw new TypeError(
        `activeEffects[${index}].${field} must be a finite number.`,
      );
    }
  }

  const stacking = effect.stacking ?? "refresh";
  if (stacking !== "refresh" && stacking !== "stack") {
    throw new RangeError(
      `activeEffects[${index}].stacking must be "refresh" or "stack".`,
    );
  }

  return {
    ...effect,
    sourceId,
    stacking,
    statModifiers: normalizeStats(
      effect.statModifiers,
      `activeEffects[${index}].statModifiers`,
    ),
    statPercentModifiers: normalizeStats(
      effect.statPercentModifiers,
      `activeEffects[${index}].statPercentModifiers`,
    ),
    hpBonus: effect.hpBonus ?? 0,
    hpPercent: effect.hpPercent ?? 0,
  };
}

function applyPercentModifiers(value, percentages, description) {
  let modifiedValue = value;
  for (const percentage of percentages) {
    modifiedValue *= 1 + percentage / 100;
    if (!Number.isFinite(modifiedValue)) {
      throw new RangeError(`${description} modifiers exceed a finite value.`);
    }
  }
  return modifiedValue;
}

export class BaseEntity {
  constructor({
    id = "",
    name = "",
    classKey = "",
    className = classKey,
    level = 1,
    baseStats = DEFAULT_BASE_STATS,
    trainedStats = {},
    equipmentSlots,
    inventory = [],
    activeEffects = [],
    hp,
  } = {}) {
    if (!Number.isInteger(level) || level < 1) {
      throw new RangeError("level must be a positive integer.");
    }
    if (typeof classKey !== "string") {
      throw new TypeError("classKey must be a string.");
    }
    if (!Array.isArray(inventory)) {
      throw new TypeError("inventory must be an array.");
    }
    if (!Array.isArray(activeEffects)) {
      throw new TypeError("activeEffects must be an array.");
    }
    if (hp !== undefined && (typeof hp !== "number" || !Number.isFinite(hp))) {
      throw new TypeError("hp must be a finite number when provided.");
    }

    this.id = id;
    this.name = name;
    this.classKey = classKey;
    this.className = className;
    this.level = level;
    this.baseStats = {
      ...DEFAULT_BASE_STATS,
      ...normalizeStats(baseStats, "baseStats"),
    };
    this.trainedStats = normalizeStats(trainedStats, "trainedStats");
    this.equipmentSlots = normalizeEquipmentSlots(equipmentSlots);
    this.inventory = inventory;
    this.activeEffects = [];
    this.nextEffectInstanceId = 1;

    const effectIds = new Set();
    this.activeEffects = activeEffects.map((effect, index) => {
      const normalized = normalizeEffect(effect, index);
      const effectId = normalized.effectId;
      if (
        typeof effectId === "string" &&
        effectId.length > 0 &&
        effectIds.has(effectId)
      ) {
        throw new RangeError(`Duplicate active effect instance id: ${effectId}.`);
      }
      if (typeof effectId === "string" && effectId.length > 0) {
        effectIds.add(effectId);
      } else {
        normalized.effectId = this.createEffectInstanceId(effectIds);
        effectIds.add(normalized.effectId);
      }
      return normalized;
    });

    this.maxHp = this.calculateMaxHp();
    this.hp = hp === undefined ? this.maxHp : Math.min(this.maxHp, Math.max(0, hp));
  }

  getModifiedStat(stat) {
    let total =
      modifierValue(this.baseStats, stat) +
      modifierValue(this.trainedStats, stat);

    for (const item of Object.values(this.equipmentSlots)) {
      total += modifierValue(item?.statModifiers, stat);
    }
    for (const effect of this.activeEffects) {
      total += modifierValue(effect.statModifiers, stat);
    }

    const percentages = [];
    for (const item of Object.values(this.equipmentSlots)) {
      const percentage = item?.statPercentModifiers?.[stat];
      if (typeof percentage === "number" && Number.isFinite(percentage)) {
        percentages.push(percentage);
      }
    }
    for (const effect of this.activeEffects) {
      percentages.push(
        modifierValue(effect.statPercentModifiers, stat),
      );
    }
    return applyPercentModifiers(total, percentages, `${stat} stat`);
  }

  setBaseStat(stat, value) {
    return this.setStatLayerValue(this.baseStats, "baseStats", stat, value);
  }

  setTrainedStat(stat, value) {
    return this.setStatLayerValue(
      this.trainedStats,
      "trainedStats",
      stat,
      value,
    );
  }

  setStatLayerValue(layer, layerName, stat, value) {
    if (typeof stat !== "string" || stat.length === 0) {
      throw new TypeError("stat must be a non-empty string.");
    }
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`${layerName}.${stat} must be a finite number.`);
    }

    layer[stat] = value;
    this.recalculateMaxHp();
    return this.getModifiedStat(stat);
  }

  calculateMaxHp() {
    let maxHp = 10 + this.getModifiedStat("sta") * 2;
    const percentageModifiers = [];

    for (const source of [this.baseStats, this.trainedStats]) {
      maxHp += modifierValue(source, "hpBonus");
      const percentage = source.hpPercent;
      if (typeof percentage === "number" && Number.isFinite(percentage)) {
        percentageModifiers.push(percentage);
      }
    }

    for (const item of Object.values(this.equipmentSlots)) {
      maxHp += modifierValue(item, "hpBonus");
      const percentage = item?.hpPercent;
      if (typeof percentage === "number" && Number.isFinite(percentage)) {
        percentageModifiers.push(percentage);
      }
    }
    for (const effect of this.activeEffects) {
      maxHp += effect.hpBonus;
      percentageModifiers.push(effect.hpPercent);
    }

    const modifiedMaxHp = applyPercentModifiers(
      maxHp,
      percentageModifiers,
      "Maximum HP",
    );
    return Math.max(0, Math.floor(modifiedMaxHp));
  }

  recalculateMaxHp() {
    const nextMaxHp = this.calculateMaxHp();
    const currentHp =
      typeof this.hp === "number" && Number.isFinite(this.hp)
        ? Math.max(0, this.hp)
        : nextMaxHp;

    this.maxHp = nextMaxHp;
    this.hp = Math.min(currentHp, nextMaxHp);
    return this.maxHp;
  }

  createEffectInstanceId(additionalIds = new Set()) {
    let effectId;
    do {
      effectId = `effect-${this.nextEffectInstanceId}`;
      this.nextEffectInstanceId += 1;
    } while (
      additionalIds.has(effectId) ||
      this.activeEffects.some((effect) => effect.effectId === effectId)
    );
    return effectId;
  }

  applyEffect(effect) {
    const normalized = normalizeEffect(effect, this.activeEffects.length);
    if (normalized.stacking === "refresh") {
      const existingIndex = this.activeEffects.findIndex(
        (activeEffect) => activeEffect.sourceId === normalized.sourceId,
      );
      if (existingIndex !== -1) {
        normalized.effectId = this.activeEffects[existingIndex].effectId;
        this.activeEffects[existingIndex] = normalized;
        this.recalculateMaxHp();
        return {
          applied: true,
          refreshed: true,
          effectId: normalized.effectId,
        };
      }
    }

    normalized.effectId = this.createEffectInstanceId();
    this.activeEffects.push(normalized);
    this.recalculateMaxHp();
    return { applied: true, refreshed: false, effectId: normalized.effectId };
  }

  removeEffect(effectId) {
    const effectIndex = this.activeEffects.findIndex(
      (effect) => effect.effectId === effectId,
    );
    if (effectIndex === -1) {
      return false;
    }

    this.activeEffects.splice(effectIndex, 1);
    this.recalculateMaxHp();
    return true;
  }

  getNaturalAcFloor() {
    return 1 + Math.floor(this.level / 2);
  }

  getTotalAc() {
    let equippedAc = 0;
    for (const item of Object.values(this.equipmentSlots)) {
      equippedAc += modifierValue(item?.statModifiers, "ac");
    }
    for (const effect of this.activeEffects) {
      equippedAc += modifierValue(effect.statModifiers, "ac");
    }

    const armorClass = this.getNaturalAcFloor() +
      modifierValue(this.trainedStats, "ac") +
      equippedAc;
    const percentageModifiers = [];
    for (const item of Object.values(this.equipmentSlots)) {
      const percentage = item?.statPercentModifiers?.ac;
      if (typeof percentage === "number" && Number.isFinite(percentage)) {
        percentageModifiers.push(percentage);
      }
    }
    for (const effect of this.activeEffects) {
      percentageModifiers.push(
        modifierValue(effect.statPercentModifiers, "ac"),
      );
    }

    return applyPercentModifiers(
      armorClass,
      percentageModifiers,
      "Armor Class",
    );
  }

  equipItem(item, requestedSlot) {
    const slot = requestedSlot === "mainhand" ? "weapon" : requestedSlot;
    if (!hasOwn(this.equipmentSlots, slot)) {
      throw new RangeError(`Unknown paperdoll slot: ${requestedSlot}.`);
    }
    if (!item || typeof item !== "object") {
      throw new TypeError("An equipment item object is required.");
    }

    const allowedClasses = item.allowedClasses;
    if (
      !Array.isArray(allowedClasses) ||
      (!allowedClasses.includes(this.classKey) && !allowedClasses.includes("all"))
    ) {
      console.error(
        `\u274c CLASS MISMATCH: THIS EQUIPMENT'S STRUCTURAL CONFIGURATION CANNOT BE WIELDED BY A ${String(this.className).toUpperCase()}!`,
      );
      return false;
    }

    const allowedSlots = Array.isArray(item.slotType) ? item.slotType : [];
    if (
      !allowedSlots.includes(slot) &&
      !(slot === "weapon" && allowedSlots.includes("mainhand"))
    ) {
      return false;
    }

    const isTwoHandedMainhand =
      slot === "weapon" && item.handsRequired === 2;

    if (isTwoHandedMainhand) {
      this.unequipItem("offhand");
    }

    this.unequipItem(slot);

    const inventoryIndex = this.inventory.indexOf(item);
    if (inventoryIndex !== -1) {
      this.inventory.splice(inventoryIndex, 1);
    }
    this.equipmentSlots[slot] = item;
    this.recalculateMaxHp();
    return true;
  }

  unequipItem(slot) {
    if (!hasOwn(this.equipmentSlots, slot)) {
      throw new RangeError(`Unknown paperdoll slot: ${slot}.`);
    }

    const item = this.equipmentSlots[slot];
    if (!item) {
      return null;
    }

    this.equipmentSlots[slot] = null;
    this.inventory.push(item);
    this.recalculateMaxHp();
    return item;
  }
}