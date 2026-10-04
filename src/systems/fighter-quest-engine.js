export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const FIGHTER_QUEST = Object.freeze({
  actOneFlag: "fighter_quest_act1",
  actTwoFlag: "fighter_quest_act2",
  actThreeFlag: "fighter_quest_act3",
  levelGate: 30,
  weaponLevelGate: 70,
  cryptCipherKeys: Object.freeze([
    "Rubinus",
    "Esmeraldu",
    "Zaffiru",
    "Electrum",
  ]),
  chassisItemId: "monolithic_greatblade_chassis",
  cipherSwords: Object.freeze([
    "sword_ruby_hilt",
    "sword_emerald_hilt",
    "sword_sapphire_hilt",
    "sword_topaz_hilt",
  ]),
  bladeFragments: Object.freeze([
    "the_greatblade_blade_fragment_atrox",
    "the_greatblade_blade_fragment_ferox",
  ]),
  actTwoComponents: Object.freeze([
    "the_greatblade_blade_fragment_atrox",
    "the_greatblade_blade_fragment_ferox",
    "the_greatblade_worn_pommel",
    "the_greatblade_cracked_crossguard",
  ]),
  oilItemId: "elemental_viscous_oil",
  apexOilItemId: "flesh_stitcher_alchemical_oil_cache",
  bloodVialId: "vial_of_myrmidu_blood",
  relicId: "monolithic_earth_shatter_claymore",
  blessingId: "bellum_vector_blessing",
  oilDropChance: 0.35,
  whiteFlashMilliseconds: 350,
  blessingDurationMinutes: 2880,
  worldMinutesPerDay: 240,
  battlefieldDimensions: Object.freeze({ width: 32, height: 32 }),
});

export const FIGHTER_QUEST_STATUS_BLOCKERS = Object.freeze([
  "POISONED",
  "DISEASED",
  "BLEEDING",
  "NECROTIC_CURSE",
]);

const BASE_CHASSIS_ID = FIGHTER_QUEST.chassisItemId;
const APEX_BOSS_ID = "the_defiled_flesh_stitcher";
const WALKABLE_TILE = 0;

function finiteNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function getActiveStatuses(character) {
  const effects = Array.isArray(character?.statusEffects)
    ? character.statusEffects
    : [];
  const statuses = Array.isArray(character?.statuses)
    ? character.statuses
    : [];
  return [...effects, ...statuses].filter(
    (status) => status && status.active !== false && status.removed !== true,
  );
}

export function checkFighterQuestVanguardGate({ fighter, vanguard } = {}) {
  if (!fighter || fighter.classKey !== "fighter") {
    return { allowed: false, reason: "fighter-required" };
  }
  if (!Array.isArray(vanguard) || vanguard.length > 4) {
    return { allowed: false, reason: "invalid-vanguard" };
  }
  if (!vanguard.includes(fighter)) {
    return { allowed: false, reason: "fighter-not-in-vanguard" };
  }
  if (!(finiteNumber(fighter.hp) > 0)) {
    return { allowed: false, reason: "fighter-not-living" };
  }
  if (getActiveStatuses(fighter).length > 0) {
    return { allowed: false, reason: "fighter-afflicted" };
  }
  return { allowed: true };
}

function requireFighterQuestGate(options) {
  const result = checkFighterQuestVanguardGate(options);
  if (!result.allowed) {
    return result;
  }
  return null;
}

function getQuestState(party) {
  if (!party || typeof party !== "object") {
    throw new TypeError("party must be an object.");
  }
  if (!party.fighterQuestState || typeof party.fighterQuestState !== "object") {
    party.fighterQuestState = {
      cipherPlacements: [null, null, null, null],
      resolvedCorpseIds: [],
      fragmentTurnedIn: false,
      chassisCreated: false,
      weaponReforged: false,
      weaponQuenched: false,
      bloodVialCreated: false,
      fused: false,
      oilDropRolls: {},
    };
  }
  const state = party.fighterQuestState;
  const placements = Array.isArray(state.cipherPlacements)
    ? state.cipherPlacements
    : [];
  state.cipherPlacements = Array.from(
    { length: FIGHTER_QUEST.cipherSwords.length },
    (_, index) => placements[index] ?? null,
  );
  if (!Array.isArray(state.resolvedCorpseIds)) state.resolvedCorpseIds = [];
  if (
    !state.oilDropRolls ||
    typeof state.oilDropRolls !== "object" ||
    Array.isArray(state.oilDropRolls)
  ) {
    state.oilDropRolls = {};
  }
  for (const key of [
    "fragmentTurnedIn",
    "chassisCreated",
    "weaponReforged",
    "weaponQuenched",
    "bloodVialCreated",
    "fused",
  ]) {
    if (typeof state[key] !== "boolean") state[key] = false;
  }
  return state;
}

function ensureStoryFlags(party) {
  if (!party.storyFlags || typeof party.storyFlags !== "object") {
    party.storyFlags = {};
  }
  return party.storyFlags;
}

function inventoryFor(party) {
  if (!Array.isArray(party.inventory)) {
    party.inventory = [];
  }
  return party.inventory;
}

function itemIdentifier(item) {
  return item?.id ?? item?.key ?? item?.identifier ?? "";
}

function allOwnedItems(party, vanguard = []) {
  const items = [...inventoryFor(party)];
  const members = new Set([
    ...(Array.isArray(party.members) ? party.members : []),
    ...(Array.isArray(party.entities) ? party.entities : []),
    ...vanguard,
  ]);
  for (const member of members) {
    if (Array.isArray(member?.inventory)) {
      items.push(...member.inventory);
    }
    const slots = member?.equipmentSlots;
    if (slots && typeof slots === "object") {
      items.push(...Object.values(slots).filter(Boolean));
    }
    if (Array.isArray(member?.equipment)) {
      items.push(...member.equipment);
    }
  }
  return items;
}

function hasOwnedItem(party, itemId, vanguard = []) {
  return allOwnedItems(party, vanguard).some(
    (item) => itemIdentifier(item) === itemId,
  );
}

function hasSharedItem(party, itemId) {
  return inventoryFor(party).some(
    (item) => itemIdentifier(item) === itemId,
  );
}

function grantUniqueItem(party, item, vanguard = []) {
  const itemId = itemIdentifier(item);
  if (!itemId) {
    throw new TypeError("A quest reward must have an item identifier.");
  }
  if (hasOwnedItem(party, itemId, vanguard)) {
    return { granted: false, reason: "already-owned", itemId };
  }
  inventoryFor(party).push(item);
  return { granted: true, item };
}

function removeSharedItems(party, itemIds) {
  if (new Set(itemIds).size !== itemIds.length) {
    throw new RangeError("Shared item removal requires unique item identifiers.");
  }
  const inventory = inventoryFor(party);
  const indices = itemIds.map((id) =>
    inventory.findIndex((item) => itemIdentifier(item) === id),
  );
  if (indices.some((index) => index < 0)) {
    return false;
  }
  for (const index of indices.sort((left, right) => right - left)) {
    inventory.splice(index, 1);
  }
  return true;
}

function setJournalEntry(party, key, value) {
  if (!party.questJournal || typeof party.questJournal !== "object") {
    party.questJournal = {};
  }
  party.questJournal[key] = value;
}

function readCustomField(entity, fieldName) {
  if (entity?.[fieldName] !== undefined) {
    return entity[fieldName];
  }
  return entity?.fieldInstances?.find(
    (field) => field?.__identifier === fieldName,
  )?.__value;
}

function isRerumNpc(npc) {
  return [npc?.id, npc?.name, npc?.__identifier].some((value) =>
    String(value ?? "").toLowerCase().includes("rerum"),
  );
}

export function processSeerMilestone({
  fighter,
  vanguard,
  party,
  seer,
  rumorCatalog = [],
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { triggered: false, ...blocked };
  if (
    !seer ||
    readCustomField(seer, "utilityType") !== "RENOWN_GATEKEEPER" ||
    finiteNumber(fighter.level) < FIGHTER_QUEST.levelGate
  ) {
    return { triggered: false, reason: "milestone-or-seer-missing" };
  }

  const flags = ensureStoryFlags(party);
  if (flags[FIGHTER_QUEST.actOneFlag]) {
    return { triggered: false, reason: "already-triggered" };
  }
  flags[FIGHTER_QUEST.actOneFlag] = true;
  seer.lotteryWheelSuppressed = true;
  seer.prophecyDelivered = true;

  for (const rumor of rumorCatalog) {
    if (rumor?.unlockKey === FIGHTER_QUEST.actOneFlag) {
      rumor.unlocked = true;
      rumor.costCopper = 0;
    }
  }
  setJournalEntry(party, FIGHTER_QUEST.actOneFlag, {
    complete: true,
    clue: "Go to the crypt of heroes where the sun rises...",
  });

  return {
    triggered: true,
    prophecy: "Bellum Vector calls from the shifting battlefields of Mensura Virtutis.",
    clueCostCopper: 0,
  };
}

export function interceptRerumConversation({
  fighter,
  vanguard,
  party,
  npc,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { intercepted: false, ...blocked };
  if (!npc || !isRerumNpc(npc)) {
    return { intercepted: false, reason: "not-rerum" };
  }
  const flags = ensureStoryFlags(party);
  if (
    finiteNumber(fighter.level) < FIGHTER_QUEST.levelGate ||
    !flags[FIGHTER_QUEST.actOneFlag]
  ) {
    return {
      intercepted: false,
      storefrontSuppressed: false,
      reason: "quest-gate-locked",
    };
  }
  if (flags.fighter_quest_rerum_possession) {
    npc.storefrontSuppressed = false;
    npc.possessionDialogActive = false;
    return {
      intercepted: false,
      storefrontSuppressed: false,
      reason: "possession-already-resolved",
    };
  }

  npc.storefrontSuppressed = true;
  npc.possessionDialogActive = true;
  npc.possessedBy = "Myrmidu";
  flags.fighter_quest_rerum_possession = true;
  setJournalEntry(party, "fighter_quest_rerum_possession", {
    complete: true,
    clue: "Go to the crypt of heroes where the sun rises...",
  });
  return {
    intercepted: true,
    storefrontSuppressed: true,
    speaker: "Myrmidu",
    dialogue:
      "Recover the shattered fragments of the greatblade. Go to the crypt of heroes where the sun rises...",
  };
}

function evaluateCipherPlacements(placements) {
  return placements.length === FIGHTER_QUEST.cipherSwords.length &&
    placements.every(
      (placement, index) =>
        placement?.swordId === FIGHTER_QUEST.cipherSwords[index] &&
        placement?.cipherKey === FIGHTER_QUEST.cryptCipherKeys[index],
    );
}

function resetCipherAfterFailure({
  party,
  vanguard,
  initiativeEngine,
  traversalTracker,
  resetSwordLayouts,
} = {}) {
  if (
    !initiativeEngine ||
    typeof initiativeEngine !== "object" ||
    !traversalTracker ||
    typeof traversalTracker !== "object" ||
    typeof resetSwordLayouts !== "function"
  ) {
    throw new TypeError(
      "Cipher failure requires initiative, traversal, and sword-reset handlers.",
    );
  }
  const resetResult = resetSwordLayouts(FIGHTER_QUEST.cipherSwords);
  if (resetResult && typeof resetResult.then === "function") {
    throw new TypeError("resetSwordLayouts must finish synchronously.");
  }
  if (resetResult === false) {
    throw new Error("Crypt sword layouts could not be reset.");
  }
  const state = getQuestState(party);
  state.cipherPlacements = null;
  for (const member of vanguard) {
    if (member && typeof member === "object") {
      member.stamina = Math.max(0, finiteNumber(member.stamina) - 5);
    }
  }
  if (traversalTracker && typeof traversalTracker === "object") {
    traversalTracker.localizedCommotionPenalty =
      Math.max(0, finiteNumber(traversalTracker.localizedCommotionPenalty)) +
      0.5;
    traversalTracker.encounterNoiseMultiplier =
      1 + traversalTracker.localizedCommotionPenalty;
  }
  if (initiativeEngine && typeof initiativeEngine === "object") {
    initiativeEngine.surpriseState = "PARTY_SURPRISED";
  }
  return {
    solved: false,
    failed: true,
    resetPlacements: true,
    staminaLostPerVanguardMember: 5,
    commotionPulse: 0.5,
    surpriseState: "PARTY_SURPRISED",
  };
}

export function placeCryptSword({
  fighter,
  vanguard,
  party,
  swordId,
  cipherKey,
  sheathIndex,
  mutateTile,
  tileMutation = {},
  initiativeEngine,
  traversalTracker,
  resetSwordLayouts,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { placed: false, ...blocked };
  if (!ensureStoryFlags(party)[FIGHTER_QUEST.actOneFlag]) {
    return { placed: false, reason: "act-one-locked" };
  }
  if (
    !FIGHTER_QUEST.cipherSwords.includes(swordId) ||
    !FIGHTER_QUEST.cryptCipherKeys.includes(cipherKey) ||
    !Number.isInteger(sheathIndex) ||
    sheathIndex < 0 ||
    sheathIndex >= FIGHTER_QUEST.cipherSwords.length
  ) {
    throw new RangeError("Invalid crypt sword, cipher key, or sheath index.");
  }

  const state = getQuestState(party);
  if (ensureStoryFlags(party)[FIGHTER_QUEST.actTwoFlag]) {
    return { placed: false, reason: "crypt-puzzle-already-solved" };
  }
  state.cipherPlacements[sheathIndex] = { swordId, cipherKey };
  if (state.cipherPlacements.some((entry) => entry === null)) {
    return {
      placed: true,
      complete: false,
      placements: state.cipherPlacements.slice(),
    };
  }
  if (!evaluateCipherPlacements(state.cipherPlacements)) {
    return resetCipherAfterFailure({
      party,
      vanguard,
      initiativeEngine,
      traversalTracker,
      resetSwordLayouts,
    });
  }
  if (typeof mutateTile !== "function") {
    throw new TypeError("mutateTile must apply the crypt shield mutation.");
  }

  const mutation = mutateTile({
    ...tileMutation,
    actionType: "MUTATE_TILE",
    intGridValue: WALKABLE_TILE,
    passable: true,
    landmark: "crypt_of_heroes_stone_shield",
  });
  if (mutation && typeof mutation.then === "function") {
    throw new TypeError("mutateTile must finish synchronously.");
  }
  if (mutation === false) {
    throw new Error("The crypt shield tile mutation was rejected.");
  }

  state.cipherPlacements = [null, null, null, null];
  ensureStoryFlags(party)[FIGHTER_QUEST.actTwoFlag] = true;
  setJournalEntry(party, FIGHTER_QUEST.actTwoFlag, {
    complete: true,
    cryptEntranceOpen: true,
  });
  return { placed: true, complete: true, mutation };
}

export function investigateCryptCipher({
  fighter,
  vanguard,
  party,
  investigator,
  enchanterRecallLore = false,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { decrypted: false, ...blocked };
  if (!ensureStoryFlags(party)[FIGHTER_QUEST.actOneFlag]) {
    return { decrypted: false, reason: "act-one-locked" };
  }
  if (
    enchanterRecallLore &&
    (investigator?.classKey !== "enchanter" || !vanguard.includes(investigator))
  ) {
    return { decrypted: false, reason: "enchanter-recall-lore-required" };
  }
  const cost = enchanterRecallLore ? 0 : 2;
  if (finiteNumber(fighter.stamina) < cost) {
    return { decrypted: false, reason: "insufficient-stamina", staminaCost: cost };
  }

  fighter.stamina = Math.max(0, finiteNumber(fighter.stamina) - cost);
  const translations = FIGHTER_QUEST.cipherSwords.map((swordId, index) => ({
    swordId,
    cipherKey: FIGHTER_QUEST.cryptCipherKeys[index],
  }));
  setJournalEntry(party, "fighter_quest_cipher_clues", translations);
  return {
    decrypted: true,
    staminaSpent: cost,
    translations,
  };
}

export function awardCommanderFragment({
  fighter,
  vanguard,
  party,
  commanderId,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { awarded: false, ...blocked };
  const fragmentByCommander = {
    atrox: FIGHTER_QUEST.bladeFragments[0],
    ferox: FIGHTER_QUEST.bladeFragments[1],
  };
  const itemId = fragmentByCommander[String(commanderId).toLowerCase()];
  if (!itemId) {
    throw new RangeError("Commander must be Atrox or Ferox.");
  }
  if (!ensureStoryFlags(party)[FIGHTER_QUEST.actTwoFlag]) {
    return { awarded: false, reason: "crypt-puzzle-not-solved" };
  }
  return grantUniqueItem(party, {
    id: itemId,
    name: `${String(commanderId).toUpperCase()} blade fragment`,
    questItem: true,
  }, vanguard);
}

export function awardCryptComponent({
  fighter,
  vanguard,
  party,
  componentId,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { awarded: false, ...blocked };
  const nonCommanderComponents = FIGHTER_QUEST.actTwoComponents.filter(
    (id) => !FIGHTER_QUEST.bladeFragments.includes(id),
  );
  if (!ensureStoryFlags(party)[FIGHTER_QUEST.actTwoFlag]) {
    return { awarded: false, reason: "crypt-puzzle-not-solved" };
  }
  if (!nonCommanderComponents.includes(componentId)) {
    throw new RangeError("Unknown non-commander crypt component.");
  }
  return grantUniqueItem(
    party,
    {
      id: componentId,
      name: componentId === FIGHTER_QUEST.actTwoComponents[2]
        ? "Worn Greatblade Pommel"
        : "Cracked Greatblade Crossguard",
      questItem: true,
    },
    vanguard,
  );
}

export async function turnInCryptComponents({
  fighter,
  vanguard,
  party,
  rerum,
  animateFade,
  relocateToParlor,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { turnedIn: false, ...blocked };
  if (!rerum || !isRerumNpc(rerum)) {
    return { turnedIn: false, reason: "not-rerum" };
  }
  const state = getQuestState(party);
  if (state.fragmentTurnedIn) {
    return { turnedIn: false, reason: "already-turned-in" };
  }
  if (
    !ensureStoryFlags(party)[FIGHTER_QUEST.actTwoFlag] ||
    !FIGHTER_QUEST.actTwoComponents.every((id) => hasSharedItem(party, id))
  ) {
    return { turnedIn: false, reason: "crypt-components-missing" };
  }
  if (typeof animateFade !== "function" || typeof relocateToParlor !== "function") {
    throw new TypeError("Fade and parlor relocation callbacks are required.");
  }

  await animateFade({ durationMs: 640, directionDelta: 180, opacityTo: 0 });
  const recheck = requireFighterQuestGate({ fighter, vanguard });
  if (recheck) return { turnedIn: false, ...recheck };
  if (!FIGHTER_QUEST.actTwoComponents.every((id) => hasSharedItem(party, id))) {
    return { turnedIn: false, reason: "crypt-components-changed" };
  }

  const relocation = await relocateToParlor(rerum);
  if (relocation === false) {
    return { turnedIn: false, reason: "parlor-relocation-failed" };
  }
  const finalGate = requireFighterQuestGate({ fighter, vanguard });
  if (finalGate) return { turnedIn: false, ...finalGate };
  if (!removeSharedItems(party, FIGHTER_QUEST.actTwoComponents)) {
    throw new Error(
      "Crypt components changed during parlor relocation; turn-in was not committed.",
    );
  }
  state.fragmentTurnedIn = true;
  state.actThreeUnlocked = true;
  const chassis = grantUniqueItem(
    party,
    {
      id: BASE_CHASSIS_ID,
      name: "Shattered Greatblade Chassis",
      slotType: ["weapon"],
      allowedClasses: ["fighter"],
      handsRequired: 2,
      qualityTier: 2,
      questItem: true,
    },
    vanguard,
  );
  state.chassisCreated = true;
  ensureStoryFlags(party)[FIGHTER_QUEST.actTwoFlag] = true;
  setJournalEntry(party, FIGHTER_QUEST.actTwoFlag, {
    complete: true,
    componentsTurnedIn: true,
    parlorUnlocked: true,
  });
  return { turnedIn: true, parlorUnlocked: true, relocation, chassis };
}

export function reforgeGreatblade({
  fighter,
  vanguard,
  party,
  chassis,
  feeCopper,
  spendCopper,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { reforged: false, ...blocked };
  if (
    !chassis ||
    itemIdentifier(chassis) !== BASE_CHASSIS_ID ||
    !hasOwnedItem(party, BASE_CHASSIS_ID, vanguard)
  ) {
    return { reforged: false, reason: "chassis-missing" };
  }
  if (!Object.isExtensible(chassis)) {
    throw new TypeError("The chassis must remain mutable for reforging.");
  }
  if (!getQuestState(party).actThreeUnlocked) {
    return { reforged: false, reason: "act-three-locked" };
  }
  if (!Number.isInteger(feeCopper) || feeCopper < 1) {
    throw new RangeError("feeCopper must be a positive integer.");
  }
  if (typeof spendCopper !== "function") {
    throw new TypeError("spendCopper must debit the reforge fee.");
  }
  if (spendCopper(feeCopper) === false) {
    return { reforged: false, reason: "insufficient-copper" };
  }

  chassis.name = "Reforged Greatblade";
  chassis.handsRequired = 2;
  chassis.magic = false;
  chassis.isQuenched = false;
  chassis.qualityTier = Math.max(3, finiteNumber(chassis.qualityTier));
  getQuestState(party).weaponReforged = true;
  setJournalEntry(party, "fighter_quest_reforge", { complete: true });
  return { reforged: true, weapon: chassis, feeCopper };
}

function recordCorpseResolution(state, corpseId) {
  const identifier = String(corpseId ?? "");
  if (!identifier) {
    throw new TypeError("A corpse identifier is required to prevent rerolls.");
  }
  if (state.resolvedCorpseIds.includes(identifier)) {
    return false;
  }
  state.resolvedCorpseIds.push(identifier);
  return true;
}

export function rollAbominationOilDrop({
  fighter,
  vanguard,
  party,
  corpseId,
  floor,
  random = Math.random,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { resolved: false, ...blocked };
  if (!Number.isInteger(floor) || floor < 1 || floor > 4) {
    throw new RangeError("Laboratory floor must be an integer from 1 to 4.");
  }
  if (typeof random !== "function") {
    throw new TypeError("random must be a function.");
  }
  const state = getQuestState(party);
  if (!state.actThreeUnlocked || !state.weaponReforged) {
    return { resolved: false, reason: "laboratory-quest-locked" };
  }
  if (!recordCorpseResolution(state, corpseId)) {
    return { resolved: false, reason: "corpse-already-resolved" };
  }
  const roll = random();
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    state.resolvedCorpseIds.pop();
    throw new RangeError("random() must return a value in the range [0, 1).");
  }
  state.oilDropRolls[corpseId] = roll;
  if (roll >= FIGHTER_QUEST.oilDropChance) {
    return { resolved: true, dropped: false, chance: FIGHTER_QUEST.oilDropChance };
  }

  const reward = grantUniqueItem(party, {
    id: FIGHTER_QUEST.oilItemId,
    name: "Elemental Viscous Oil",
    questItem: true,
  }, vanguard);
  return {
    resolved: true,
    dropped: reward.granted,
    reason: reward.reason,
    item: reward.item,
    chance: FIGHTER_QUEST.oilDropChance,
  };
}

export function awardFleshStitcherOil({
  fighter,
  vanguard,
  party,
  bossId,
  floor,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { awarded: false, ...blocked };
  if (!getQuestState(party).weaponReforged) {
    return { awarded: false, reason: "weapon-not-reforged" };
  }
  if (
    String(bossId).toLowerCase() !== APEX_BOSS_ID ||
    floor !== 4
  ) {
    return { awarded: false, reason: "apex-boss-required" };
  }
  return grantUniqueItem(party, {
    id: FIGHTER_QUEST.apexOilItemId,
    name: "Flesh-Stitcher Alchemical Oil Cache",
    questItem: true,
  }, vanguard);
}

export function quenchGreatblade({
  fighter,
  vanguard,
  party,
  chassis,
  oilIds = [FIGHTER_QUEST.oilItemId, FIGHTER_QUEST.apexOilItemId],
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { quenched: false, ...blocked };
  const state = getQuestState(party);
  if (!state.weaponReforged || !chassis || itemIdentifier(chassis) !== BASE_CHASSIS_ID) {
    return { quenched: false, reason: "reforged-chassis-required" };
  }
  if (state.weaponQuenched || !hasOwnedItem(party, BASE_CHASSIS_ID, vanguard)) {
    return { quenched: false, reason: "reforged-chassis-not-available" };
  }
  if (!Object.isExtensible(chassis)) {
    throw new TypeError("The reforged chassis must remain mutable for quenching.");
  }
  if (!Array.isArray(oilIds) || oilIds.length === 0 || !oilIds.every((id) => hasSharedItem(party, id))) {
    return { quenched: false, reason: "oil-cache-missing" };
  }

  if (!removeSharedItems(party, oilIds)) {
    return { quenched: false, reason: "oil-cache-changed" };
  }
  chassis.isQuenched = true;
  state.weaponQuenched = true;
  setJournalEntry(party, "fighter_quest_quenching", { complete: true });
  const vial = grantUniqueItem(party, {
    id: FIGHTER_QUEST.bloodVialId,
    name: "Vial of Myrmidu's Blood",
    questItem: true,
  }, vanguard);
  state.bloodVialCreated = true;
  return { quenched: true, weapon: chassis, bloodVial: vial };
}

export function canResolveLeylinePortal({ fighter, vanguard, party } = {}) {
  const blocked = checkFighterQuestVanguardGate({ fighter, vanguard });
  if (!blocked.allowed) return blocked;
  if (!getQuestState(party).bloodVialCreated) {
    return { allowed: false, reason: "blood-vial-not-created" };
  }
  if (!hasSharedItem(party, FIGHTER_QUEST.bloodVialId)) {
    return { allowed: false, reason: "blood-vial-required" };
  }
  return { allowed: true };
}

export function enterMensuraVirtutis({
  fighter,
  vanguard,
  party,
  battlefield,
  spawnLegions,
} = {}) {
  const gate = canResolveLeylinePortal({ fighter, vanguard, party });
  if (!gate.allowed) return { entered: false, ...gate };
  if (!battlefield || typeof battlefield !== "object") {
    throw new TypeError("battlefield data is required.");
  }
  if (typeof spawnLegions !== "function") {
    throw new TypeError("spawnLegions must populate the Mensura battlefield.");
  }
  const regiments = spawnLegions({
    width: FIGHTER_QUEST.battlefieldDimensions.width,
    height: FIGHTER_QUEST.battlefieldDimensions.height,
    zone: battlefield,
  });
  if (!Array.isArray(regiments) || regiments.length === 0) {
    throw new Error("Mensura must contain hostile legion regiments.");
  }
  battlefield.width = FIGHTER_QUEST.battlefieldDimensions.width;
  battlefield.height = FIGHTER_QUEST.battlefieldDimensions.height;
  battlefield.retreatDisabled = true;
  battlefield.hostileRegiments = regiments;
  battlefield.isRevisited = battlefield.isRevisited === true;
  ensureStoryFlags(party).fighter_quest_mensura_entered = true;
  return { entered: true, battlefield };
}

export function installMensuraPortalExit({
  fighter,
  vanguard,
  party,
  zone,
  tileTypes,
  mutateTile,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { installed: false, ...blocked };
  if (!ensureStoryFlags(party).fighter_quest_mensura_entered) {
    return { installed: false, reason: "mensura-not-entered" };
  }
  if (
    !zone ||
    typeof zone !== "object" ||
    !tileTypes ||
    tileTypes.PORTAL_EXIT === undefined ||
    typeof mutateTile !== "function"
  ) {
    throw new TypeError("Zone, TILE_TYPES.PORTAL_EXIT, and mutateTile are required.");
  }

  const grid = Array.isArray(zone.map)
    ? zone.map
    : Array.isArray(zone.grid)
      ? zone.grid
      : null;
  const height = grid?.length ?? zone.height;
  const width = grid?.[0]?.length ?? zone.width;
  if (
    !Number.isInteger(width) ||
    width <= 0 ||
    !Number.isInteger(height) ||
    height <= 0
  ) {
    throw new RangeError("Mensura zone must expose valid grid dimensions.");
  }
  const x = width - 1;
  const y = height - 1;
  const mutation = mutateTile({
    actionType: "MUTATE_TILE",
    x,
    y,
    tileType: tileTypes.PORTAL_EXIT,
    landmark: "mensura_portal_exit",
  });
  if (mutation && typeof mutation.then === "function") {
    throw new TypeError("mutateTile must finish synchronously.");
  }
  if (mutation === false) {
    throw new Error("Mensura portal-exit tile mutation was rejected.");
  }

  if (!zone.interactables || typeof zone.interactables !== "object") {
    zone.interactables = {};
  }
  zone.interactables.portalExit = { x, y, tileType: tileTypes.PORTAL_EXIT };
  return {
    installed: true,
    x,
    y,
    tileType: tileTypes.PORTAL_EXIT,
    activeDestinationMap: zone.interactables.active_destination_map ?? null,
  };
}

export async function completeMyrmiduFusion({
  fighter,
  vanguard,
  party,
  weapon,
  zone,
  atMyrmidu = false,
  showWhiteFlash,
  teleportToWizard,
  wizardPosition,
  worldTimeMinutes,
} = {}) {
  const blocked = requireFighterQuestGate({ fighter, vanguard });
  if (blocked) return { fused: false, ...blocked };
  const state = getQuestState(party);
  if (state.fused) return { fused: false, reason: "already-fused" };
  if (!state.actThreeUnlocked || !ensureStoryFlags(party).fighter_quest_mensura_entered) {
    return { fused: false, reason: "mensura-quest-locked" };
  }
  if (!atMyrmidu) return { fused: false, reason: "myrmidu-not-reached" };
  if (!zone || typeof zone !== "object" || !Object.isExtensible(zone)) {
    throw new TypeError("The active battlefield zone is required for persistence.");
  }
  if (
    !state.weaponQuenched ||
    !weapon ||
    itemIdentifier(weapon) !== BASE_CHASSIS_ID ||
    !weapon.isQuenched ||
    !hasOwnedItem(party, BASE_CHASSIS_ID, vanguard) ||
    !hasSharedItem(party, FIGHTER_QUEST.bloodVialId)
  ) {
    return { fused: false, reason: "quenched-weapon-and-blood-vial-required" };
  }
  if (typeof showWhiteFlash !== "function" || typeof teleportToWizard !== "function") {
    throw new TypeError("White-flash and wizard-teleport callbacks are required.");
  }
  if (!wizardPosition || typeof wizardPosition !== "object") {
    throw new TypeError("A wizard sidewalk destination position is required.");
  }
  if (weapon.abilities !== undefined && !Array.isArray(weapon.abilities)) {
    throw new TypeError("The reforged weapon abilities must be an array.");
  }
  if (!Object.isExtensible(weapon)) {
    throw new TypeError("The quenched weapon must remain mutable for fusion.");
  }
  if (!Number.isFinite(worldTimeMinutes) || worldTimeMinutes < 0) {
    throw new RangeError("worldTimeMinutes must be a non-negative number.");
  }
  if (!party.modifiers || typeof party.modifiers !== "object" || Array.isArray(party.modifiers)) {
    party.modifiers = {};
  }
  if (!Object.isExtensible(party.modifiers)) {
    throw new TypeError("Party modifiers must remain mutable for the blessing.");
  }
  if (party.modifiers[FIGHTER_QUEST.blessingId]) {
    throw new Error("Bellum Vector blessing already exists; refusing to duplicate it.");
  }
  if (
    vanguard.some(
      (member) =>
        !Object.isExtensible(member) ||
        !Number.isFinite(member?.maxHp) ||
        member.maxHp < 0 ||
        !Number.isFinite(member?.maxMp) ||
        member.maxMp < 0 ||
        !Number.isFinite(member?.maxStamina) ||
        member.maxStamina < 0,
    )
  ) {
    throw new TypeError(
      "Every vanguard member must have finite maximum HP, MP, and Stamina values.",
    );
  }

  await showWhiteFlash(FIGHTER_QUEST.whiteFlashMilliseconds);
  const recheck = requireFighterQuestGate({ fighter, vanguard });
  if (recheck) return { fused: false, ...recheck };
  const teleportResult = await teleportToWizard(wizardPosition);
  if (teleportResult === false) {
    throw new Error("The post-fusion teleport to the Wizard failed.");
  }
  const postTeleportGate = requireFighterQuestGate({ fighter, vanguard });
  if (postTeleportGate) return { fused: false, ...postTeleportGate };
  if (state.fused || party.modifiers[FIGHTER_QUEST.blessingId]) {
    return { fused: false, reason: "fusion-already-committed" };
  }
  if (
    vanguard.some(
      (member) =>
        !Object.isExtensible(member) ||
        !Number.isFinite(member.maxHp) ||
        member.maxHp < 0 ||
        !Number.isFinite(member.maxMp) ||
        member.maxMp < 0 ||
        !Number.isFinite(member.maxStamina) ||
        member.maxStamina < 0,
    )
  ) {
    throw new TypeError(
      "Maximum vanguard resource values changed during fusion.",
    );
  }

  weapon.id = FIGHTER_QUEST.relicId;
  weapon.name = "Monolithic Earth-Shatter Claymore";
  weapon.handsRequired = 2;
  weapon.qualityTier = 4;
  weapon.magic = true;
  weapon.durability = "shatter-proof";
  weapon.requiredLevel = FIGHTER_QUEST.weaponLevelGate;
  weapon.abilities = [...new Set([...(weapon.abilities ?? []), "titanic_shockwave_quake"])];
  weapon.titanicShockwaveQuake = {
    staminaCost: 0,
    cooldownRounds: 6,
    targetType: "PIERCE_RANKS",
    requiresTwoHanded: true,
    requiredLevel: FIGHTER_QUEST.weaponLevelGate,
    damageSplit: {
      bludgeoning: 95,
      physical: 80,
      shockwave_kinetic: 60,
    },
    backgroundStunChance: 0.85,
    backgroundStunRounds: 2,
  };
  for (const member of vanguard) {
    member.hp = finiteNumber(member.maxHp, finiteNumber(member.hp));
    member.mp = finiteNumber(member.maxMp, finiteNumber(member.mp));
    member.stamina = finiteNumber(member.maxStamina, finiteNumber(member.stamina));
    member.statusEffects = [];
    member.statuses = [];
  }

  party.modifiers[FIGHTER_QUEST.blessingId] = {
    id: FIGHTER_QUEST.blessingId,
    damageBonus: 0.2,
    potencyBonus: 0.2,
    nonDegradable: true,
    remainingWorldMinutes: FIGHTER_QUEST.blessingDurationMinutes,
    lastObservedWorldTimeMinutes:
      worldTimeMinutes % FIGHTER_QUEST.worldMinutesPerDay,
  };
  zone.is_revisited = true;
  state.fused = true;
  ensureStoryFlags(party)[FIGHTER_QUEST.actThreeFlag] = true;
  setJournalEntry(party, FIGHTER_QUEST.actThreeFlag, { complete: true });
  return {
    fused: true,
    weapon,
    blessing: party.modifiers[FIGHTER_QUEST.blessingId],
    teleportResult,
  };
}

export function expireBellumVectorBlessing(party, worldTimeMinutes) {
  if (!Number.isFinite(worldTimeMinutes) || worldTimeMinutes < 0) {
    throw new RangeError("worldTimeMinutes must be a non-negative number.");
  }
  const blessing = party?.modifiers?.[FIGHTER_QUEST.blessingId];
  if (!blessing) {
    return { expired: false, blessing: null };
  }
  const currentMinute =
    worldTimeMinutes % FIGHTER_QUEST.worldMinutesPerDay;
  const previousMinute = blessing.lastObservedWorldTimeMinutes;
  if (!Number.isFinite(previousMinute)) {
    blessing.lastObservedWorldTimeMinutes = currentMinute;
  } else {
    const elapsed =
      (currentMinute -
        previousMinute +
        FIGHTER_QUEST.worldMinutesPerDay) %
      FIGHTER_QUEST.worldMinutesPerDay;
    if (elapsed > 0) {
      blessing.remainingWorldMinutes = Math.max(
        0,
        finiteNumber(blessing.remainingWorldMinutes) - elapsed,
      );
      blessing.lastObservedWorldTimeMinutes = currentMinute;
    }
  }
  if (finiteNumber(blessing.remainingWorldMinutes) <= 0) {
    delete party.modifiers[FIGHTER_QUEST.blessingId];
    return { expired: true, blessing: null };
  }
  return { expired: false, blessing: blessing ?? null };
}

export function recordFighterQuestWorldMinute(party, worldTimeMinutes) {
  return expireBellumVectorBlessing(party, worldTimeMinutes);
}

export function getBellumVectorOffensiveMultiplier(party, worldTimeMinutes) {
  const result = expireBellumVectorBlessing(party, worldTimeMinutes);
  return result.blessing ? 1 + result.blessing.damageBonus : 1;
}

export function getBellumVectorPotencyMultiplier(party, worldTimeMinutes) {
  const result = expireBellumVectorBlessing(party, worldTimeMinutes);
  return result.blessing ? 1 + result.blessing.potencyBonus : 1;
}

export async function routeMensuraPortalExit({
  zone,
  player,
  routeToDestination,
} = {}) {
  const destination =
    zone?.interactables?.active_destination_map;
  if (typeof destination !== "string" || destination.length === 0) {
    return { routed: false, reason: "portal-destination-missing" };
  }
  if (!player || typeof player !== "object" || typeof routeToDestination !== "function") {
    throw new TypeError("Player and destination router are required.");
  }

  const result = await routeToDestination(destination, player);
  if (result === false) {
    throw new Error(`Portal routing to "${destination}" failed.`);
  }
  return { routed: true, destination, result };
}