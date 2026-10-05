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
    this.recalculateResourcePools();
    return this.maxHp;
  }

  recalculateResourcePools() {
    if (!this.resourceBaselineStats) return;
    const nextMaxMp = Math.max(
      0,
      this.baseMaxMp +
        this.getModifiedStat("int") -
        this.resourceBaselineStats.int,
    );
    const nextMaxStamina = Math.max(
      0,
      this.baseMaxStamina +
        this.getModifiedStat("sta") -
        this.resourceBaselineStats.sta,
    );
    this.maxMp = nextMaxMp;
    this.mp = Math.min(this.mp, nextMaxMp);
    this.maxStamina = nextMaxStamina;
    this.stamina = Math.min(this.stamina, nextMaxStamina);
    return { maxMp: this.maxMp, maxStamina: this.maxStamina };
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

function readLdtkFields(entity) {
  const fields = {};
  for (const field of entity.fieldInstances ?? []) {
    if (field && typeof field.__identifier === "string") {
      fields[field.__identifier] = field.__value;
    }
  }
  return fields;
}

function createActor(options = {}, actorType = "character") {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Entity factory options must be an object.");
  }

  const level = options.level ?? 1;
  const stats = options.stats ?? options.baseStats ?? {};
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
    throw new TypeError("Entity stats must be an object.");
  }

  const baseStats = { ...stats };
  const trainedStats = { ...options.trainedStats };
  const staminaStat =
    (typeof baseStats.sta === "number"
      ? baseStats.sta
      : DEFAULT_BASE_STATS.sta) + modifierValue(trainedStats, "sta");

  if (typeof options.baseHp === "number") {
    baseStats.hpBonus =
      options.baseHp -
      10 -
      staminaStat * 2 -
      modifierValue(trainedStats, "hpBonus");
  }

  if (typeof baseStats.ac === "number") {
    trainedStats.ac = baseStats.ac - (1 + Math.floor(level / 2));
    delete baseStats.ac;
  }

  const equipmentSlots = options.equipmentSlots
    ? { ...options.equipmentSlots }
    : undefined;
  if (
    equipmentSlots &&
    Object.prototype.hasOwnProperty.call(equipmentSlots, "body")
  ) {
    equipmentSlots.chest ??= equipmentSlots.body;
    delete equipmentSlots.body;
  }

  const entity = new BaseEntity({
    id: options.id ?? options.iid ?? "",
    name: options.name ?? options.__identifier ?? "",
    classKey: options.classKey ?? options.baseClass ?? "",
    className:
      options.className ?? options.classKey ?? options.baseClass ?? "",
    level,
    baseStats,
    trainedStats,
    equipmentSlots,
    inventory: options.inventory,
    activeEffects: options.activeEffects,
    hp: options.hp,
  });

  entity.actorType = actorType;
  entity.iid = options.iid ?? null;
  entity.ldtkIdentifier = options.__identifier ?? null;
  entity.customFields = options.customFields ?? {};
  entity.tags = Array.isArray(options.tags) ? [...options.tags] : [];
  entity.grid = Array.isArray(options.__grid) ? [...options.__grid] : null;
  entity.abilities = Array.isArray(options.abilities)
    ? [...options.abilities]
    : [];
  entity.spellbook = Array.isArray(options.spellbook)
    ? [...options.spellbook]
    : [];
  entity.experience = options.experience ?? options.baseXpReward ?? 0;
  entity.gold = options.gold ?? 0;
  entity.baseMaxMp = options.maxMp ?? 0;
  entity.baseMaxStamina =
    options.maxStamina ??
    Math.max(0, Math.floor(entity.getModifiedStat("sta") * 2));
  entity.resourceBaselineStats = {
    int:
      options.resourceBaselineStats?.int ?? entity.getModifiedStat("int"),
    sta:
      options.resourceBaselineStats?.sta ?? entity.getModifiedStat("sta"),
  };
  entity.maxMp = Math.max(
    0,
    entity.baseMaxMp +
      entity.getModifiedStat("int") -
      entity.resourceBaselineStats.int,
  );
  entity.maxStamina = Math.max(
    0,
    entity.baseMaxStamina +
      entity.getModifiedStat("sta") -
      entity.resourceBaselineStats.sta,
  );
  entity.mp = options.mp ?? entity.maxMp;
  entity.stamina = options.stamina ?? entity.maxStamina;
  entity.statusEffects = Array.isArray(options.statusEffects)
    ? [...options.statusEffects]
    : [];

  Object.defineProperty(entity, "stats", {
    enumerable: true,
    get() {
      const statKeys = new Set([
        ...Object.keys(this.baseStats),
        ...Object.keys(this.trainedStats),
      ]);
      const currentStats = {};
      for (const stat of statKeys) {
        currentStats[stat] =
          stat === "ac" ? this.getTotalAc() : this.getModifiedStat(stat);
      }
      currentStats.ac = this.getTotalAc();
      return currentStats;
    },
  });
  Object.defineProperty(entity, "equipment", {
    enumerable: true,
    get() {
      return Object.values(this.equipmentSlots).filter(Boolean);
    },
  });

  return entity;
}

function createLdtkActor(entity) {
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) {
    throw new TypeError("An LDtk entity instance is required.");
  }

  const customFields = readLdtkFields(entity);
  const stats =
    typeof customFields.stats === "string"
      ? JSON.parse(customFields.stats)
      : customFields.stats;
  const options = {
    ...customFields,
    id: entity.iid,
    iid: entity.iid,
    name: customFields.name ?? entity.__identifier,
    classKey: customFields.classKey ?? customFields.baseClass ?? "",
    level: customFields.level ?? 1,
    stats: stats ?? {},
    tags: entity.__tags,
    __identifier: entity.__identifier,
    __grid: entity.__grid,
    customFields,
  };

  return createActor(options, "ldtk");
}

export const entityFactory = Object.freeze({
  player(options = {}) {
    return createActor(options, "player");
  },
  companion(options = {}) {
    return createActor(options, "companion");
  },
  monster(options = {}) {
    return createActor(options, "monster");
  },
  fromLdtk: createLdtkActor,
});