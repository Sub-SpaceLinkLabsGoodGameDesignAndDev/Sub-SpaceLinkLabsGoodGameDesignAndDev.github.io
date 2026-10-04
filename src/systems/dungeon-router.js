export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const TOWN_VAULT_KEY = "vault_bank_copper";
export const RESERVE_BAG_KEY = "reserveBag";
export const RESERVE_BAG_CAPACITY = 10;
export const DUNGEON_MAX_RENDER_DISTANCE = 16;
export const DUNGEON_REALM_TYPE = "DUNGEON";
export const DUNGEON_LEVEL_IDENTIFIERS = Object.freeze([
  "Oakhaven_SewerSystem_1",
  "Oakhaven_SewerSystem_2",
  "Oakhaven_SewerSystem_3",
  "Oakhaven_SewerSystem_4",
]);
export const IMPASSABLE_INTGRID_VALUES = Object.freeze([1, 3, 4]);
export const DEFAULT_WALKABLE_INTGRID_VALUES = Object.freeze([
  0,
  2,
  8,
  10,
  11,
  13,
  15,
]);

const DIRECTIONS = Object.freeze([
  Object.freeze({ x: 0, y: -1 }),
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: -1, y: 0 }),
]);
const NEIGHBOR_OFFSETS = Object.freeze(
  Array.from({ length: 3 }, (_, y) =>
    Array.from({ length: 3 }, (_, x) => ({ x: x - 1, y: y - 1 })),
  )
    .flat()
    .filter(({ x, y }) => x !== 0 || y !== 0),
);

function finiteInteger(value, name, { minimum = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${name} must be a safe integer greater than or equal to ${minimum}.`);
  }
  return value;
}

function requireObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
  return value;
}

function readField(fieldInstances, identifier) {
  if (Array.isArray(fieldInstances)) {
    const field = fieldInstances.find(
      (instance) => instance?.__identifier === identifier,
    );
    return field?.__value;
  }
  return fieldInstances?.[identifier];
}

function readLevelIdentifier(levelData) {
  return String(
    levelData?.identifier ??
      levelData?.iid ??
      levelData?.levelIdentifier ??
      "",
  );
}

function levelRealmType(levelData) {
  return String(
    levelData?.zoneRealmType ??
      levelData?.metadata?.zoneRealmType ??
      readField(levelData?.metadata?.fieldInstances, "zoneRealmType") ??
      readField(levelData?.fieldInstances, "zoneRealmType") ??
      readField(levelData?.fields, "zoneRealmType") ??
      "",
  ).toUpperCase();
}

function isKnownDungeonLevel(levelData) {
  return DUNGEON_LEVEL_IDENTIFIERS.includes(readLevelIdentifier(levelData));
}

function isSafeTownLevel(levelData) {
  const safeZone =
    levelData?.safeZone ??
    levelData?.Safe_Zone ??
    readField(levelData?.fieldInstances, "Safe_Zone");
  return safeZone === true && levelRealmType(levelData) !== DUNGEON_REALM_TYPE;
}

function getStructuralGrid(levelData) {
  if (Array.isArray(levelData)) {
    return { grid: levelData, width: levelData[0]?.length ?? 0, height: levelData.length };
  }
  if (Array.isArray(levelData?.map)) {
    return {
      grid: levelData.map,
      width: levelData.map[0]?.length ?? 0,
      height: levelData.map.length,
    };
  }

  const layers = Array.isArray(levelData?.layerInstances)
    ? levelData.layerInstances
    : [];
  const layer = layers.find(
    (candidate) => candidate?.__identifier === "Structural_Grid",
  );
  if (!layer || !Array.isArray(layer.intGridCsv)) {
    throw new TypeError(
      "levelData must contain a row grid or a Structural_Grid intGridCsv layer.",
    );
  }
  const width = layer.__cWid;
  const height = layer.__cHei;
  if (
    !Number.isSafeInteger(width) ||
    width < 1 ||
    !Number.isSafeInteger(height) ||
    height < 1 ||
    layer.intGridCsv.length !== width * height
  ) {
    throw new RangeError("Structural_Grid dimensions do not match intGridCsv.");
  }
  return {
    grid: Array.from({ length: height }, (_, y) =>
      layer.intGridCsv.slice(y * width, (y + 1) * width),
    ),
    width,
    height,
  };
}

function validateRectangularGrid(grid) {
  if (
    !Array.isArray(grid) ||
    grid.length === 0 ||
    !Array.isArray(grid[0]) ||
    grid[0].length === 0
  ) {
    throw new RangeError("The structural grid must be non-empty.");
  }
  const width = grid[0].length;
  if (grid.some((row) => !Array.isArray(row) || row.length !== width)) {
    throw new RangeError("The structural grid must be rectangular.");
  }
  return { width, height: grid.length };
}

function inBounds(x, y, width, height) {
  return Number.isInteger(x) && Number.isInteger(y) &&
    x >= 0 && x < width && y >= 0 && y < height;
}

function isWalkableCell(grid, x, y, width, height, walkableValues) {
  return (
    inBounds(x, y, width, height) &&
    walkableValues.has(grid[y][x]) &&
    !IMPASSABLE_INTGRID_VALUES.includes(grid[y][x])
  );
}

function readEntityFields(entity) {
  const fields = entity?.fieldInstances;
  if (Array.isArray(fields)) {
    return Object.fromEntries(
      fields.map(({ __identifier, __value }) => [__identifier, __value]),
    );
  }
  return fields && typeof fields === "object" ? fields : {};
}

function getEntityGridPosition(entity, gridSize) {
  if (
    Array.isArray(entity?.__grid) &&
    Number.isInteger(entity.__grid[0]) &&
    Number.isInteger(entity.__grid[1])
  ) {
    return { x: entity.__grid[0], y: entity.__grid[1] };
  }
  if (
    Array.isArray(entity?.px) &&
    Number.isFinite(entity.px[0]) &&
    Number.isFinite(entity.px[1]) &&
    Number.isFinite(gridSize) &&
    gridSize > 0
  ) {
    return {
      x: Math.floor(entity.px[0] / gridSize),
      y: Math.floor(entity.px[1] / gridSize),
    };
  }
  return null;
}

function collectLevelEntities(levelData) {
  const layers = Array.isArray(levelData?.layerInstances)
    ? levelData.layerInstances
    : [];
  return layers.flatMap((layer) =>
    Array.isArray(layer?.entityInstances) ? layer.entityInstances : [],
  );
}

function hasInteractiveEscape(levelData, x, y, gridSize, extraEntities = []) {
  const entities = [...collectLevelEntities(levelData), ...extraEntities];
  return entities.some((entity) => {
    const position = getEntityGridPosition(entity, gridSize);
    if (!position || Math.abs(position.x - x) > 1 || Math.abs(position.y - y) > 1) {
      return false;
    }
    const fields = readEntityFields(entity);
    return (
      fields.utilityType != null ||
      entity.interactive === true ||
      entity.isSwitch === true ||
      (Array.isArray(entity.__tags) &&
        entity.__tags.some((tag) => /interactive|switch|portal|transition/i.test(tag)))
    );
  });
}

function isEnclosedDeadEnd(
  grid,
  x,
  y,
  width,
  height,
  hasInteractiveNeighbor,
) {
  if (hasInteractiveNeighbor) {
    return false;
  }
  return NEIGHBOR_OFFSETS.every(({ x: dx, y: dy }) => {
    const nx = x + dx;
    const ny = y + dy;
    if (!inBounds(nx, ny, width, height)) {
      return true;
    }
    return IMPASSABLE_INTGRID_VALUES.includes(grid[ny][nx]);
  });
}

function findNearestWalkable(grid, start, dimensions, walkableValues) {
  const queue = [{ x: start.x, y: start.y, distance: 0 }];
  const visited = new Set([`${start.x},${start.y}`]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const direction of DIRECTIONS) {
      const x = current.x + direction.x;
      const y = current.y + direction.y;
      if (!inBounds(x, y, dimensions.width, dimensions.height)) {
        continue;
      }
      const key = `${x},${y}`;
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      if (isWalkableCell(grid, x, y, dimensions.width, dimensions.height, walkableValues)) {
        return { x, y };
      }
      queue.push({ x, y, distance: current.distance + 1 });
    }
  }
  return null;
}

export function initializePartyStorage(party) {
  requireObject(party, "party");
  if (party[TOWN_VAULT_KEY] == null) {
    party[TOWN_VAULT_KEY] = 0;
  } else {
    finiteInteger(party[TOWN_VAULT_KEY], TOWN_VAULT_KEY);
  }
  if (party.dormantPool == null) {
    party.dormantPool = [];
  }
  if (!Array.isArray(party.dormantPool)) {
    throw new TypeError("party.dormantPool must be an array.");
  }
  for (const companion of party.dormantPool) {
    requireObject(companion, "dormant companion");
    if (companion[RESERVE_BAG_KEY] == null) {
      companion[RESERVE_BAG_KEY] = [];
    }
    if (!Array.isArray(companion[RESERVE_BAG_KEY])) {
      throw new TypeError("companion.reserveBag must be an array.");
    }
    if (companion[RESERVE_BAG_KEY].length > RESERVE_BAG_CAPACITY) {
      throw new RangeError(
        `companion.reserveBag cannot exceed ${RESERVE_BAG_CAPACITY} items.`,
      );
    }
  }
  return party;
}

function requireSafeTownTransaction(party, safeTown, levelData) {
  if (safeTown !== true && !isSafeTownLevel(levelData)) {
    throw new Error("Vault and reserve storage transactions are only available in a safe town.");
  }
  if (levelRealmType(levelData) === DUNGEON_REALM_TYPE) {
    throw new Error("Vault and reserve storage transactions are disabled in dungeons.");
  }
  initializePartyStorage(party);
}

function resolveWallet(party, wallet) {
  const resolvedWallet = wallet ?? party.player ?? party.leader ?? party;
  requireObject(resolvedWallet, "wallet");
  finiteInteger(resolvedWallet.totalCopper, "wallet.totalCopper");
  return resolvedWallet;
}

export function depositCopperToTownVault({
  party,
  wallet,
  amount,
  safeTown = false,
  levelData,
} = {}) {
  requireObject(party, "party");
  finiteInteger(amount, "amount");
  requireSafeTownTransaction(party, safeTown, levelData);
  const activeWallet = resolveWallet(party, wallet);
  if (amount > activeWallet.totalCopper) {
    return { transferred: false, reason: "insufficient-wallet-funds" };
  }
  const nextWalletCopper = activeWallet.totalCopper - amount;
  const nextVaultCopper = party[TOWN_VAULT_KEY] + amount;
  finiteInteger(nextWalletCopper, "wallet.totalCopper");
  finiteInteger(nextVaultCopper, TOWN_VAULT_KEY);
  activeWallet.totalCopper = nextWalletCopper;
  party[TOWN_VAULT_KEY] = nextVaultCopper;
  return {
    transferred: true,
    amount,
    walletCopper: activeWallet.totalCopper,
    vaultCopper: party[TOWN_VAULT_KEY],
  };
}

export function withdrawCopperFromTownVault({
  party,
  wallet,
  amount,
  safeTown = false,
  levelData,
} = {}) {
  requireObject(party, "party");
  finiteInteger(amount, "amount");
  requireSafeTownTransaction(party, safeTown, levelData);
  const activeWallet = resolveWallet(party, wallet);
  if (amount > party[TOWN_VAULT_KEY]) {
    return { transferred: false, reason: "insufficient-vault-funds" };
  }
  const nextWalletCopper = activeWallet.totalCopper + amount;
  const nextVaultCopper = party[TOWN_VAULT_KEY] - amount;
  finiteInteger(nextWalletCopper, "wallet.totalCopper");
  finiteInteger(nextVaultCopper, TOWN_VAULT_KEY);
  activeWallet.totalCopper = nextWalletCopper;
  party[TOWN_VAULT_KEY] = nextVaultCopper;
  return {
    transferred: true,
    amount,
    walletCopper: activeWallet.totalCopper,
    vaultCopper: party[TOWN_VAULT_KEY],
  };
}

export function benchCompanion({
  party,
  companion,
  safeTown = false,
  levelData,
} = {}) {
  requireObject(party, "party");
  requireObject(companion, "companion");
  requireSafeTownTransaction(party, safeTown, levelData);
  if (party.leader === companion) {
    return { benched: false, reason: "party-leader-cannot-be-benched" };
  }
  const activeRoster = party.entities;
  if (!Array.isArray(activeRoster)) {
    throw new TypeError("party.entities must be an array.");
  }
  const index = activeRoster.indexOf(companion);
  if (index === -1) {
    return {
      benched: false,
      reason: party.dormantPool.includes(companion)
        ? "already-benched"
        : "companion-not-in-active-roster",
    };
  }
  if (party.dormantPool.includes(companion)) {
    throw new Error("Companion cannot be present in both active and dormant rosters.");
  }
  if (companion[RESERVE_BAG_KEY] == null) {
    companion[RESERVE_BAG_KEY] = [];
  }
  if (!Array.isArray(companion[RESERVE_BAG_KEY])) {
    throw new TypeError("companion.reserveBag must be an array.");
  }
  if (companion[RESERVE_BAG_KEY].length > RESERVE_BAG_CAPACITY) {
    throw new RangeError(`companion.reserveBag cannot exceed ${RESERVE_BAG_CAPACITY} items.`);
  }
  activeRoster.splice(index, 1);
  party.dormantPool.push(companion);
  return { benched: true, companion, reserveBag: companion[RESERVE_BAG_KEY] };
}

function requireBenchedCompanion(party, companion) {
  if (!party.dormantPool.includes(companion)) {
    throw new Error("Reserve storage is only available for a benched companion.");
  }
  if (!Array.isArray(companion[RESERVE_BAG_KEY])) {
    throw new TypeError("companion.reserveBag must be an array.");
  }
}

export function transferItemToReserveBag({
  party,
  companion,
  itemIndex,
  sourceInventory,
  safeTown = false,
  levelData,
} = {}) {
  requireObject(party, "party");
  requireObject(companion, "companion");
  finiteInteger(itemIndex, "itemIndex");
  requireSafeTownTransaction(party, safeTown, levelData);
  requireBenchedCompanion(party, companion);
  const source = sourceInventory ?? party.inventory;
  if (!Array.isArray(source)) {
    throw new TypeError("sourceInventory or party.inventory must be an array.");
  }
  const reserveBag = companion[RESERVE_BAG_KEY];
  if (itemIndex >= source.length) {
    return { transferred: false, reason: "item-index-out-of-range" };
  }
  if (reserveBag.length >= RESERVE_BAG_CAPACITY) {
    return { transferred: false, reason: "reserve-bag-full" };
  }
  if (source === reserveBag) {
    throw new Error("An item cannot be transferred from a reserve bag into itself.");
  }
  const [item] = source.splice(itemIndex, 1);
  reserveBag.push(item);
  return { transferred: true, item, reserveBagSlotsUsed: reserveBag.length };
}

export function transferItemFromReserveBag({
  party,
  companion,
  itemIndex,
  destinationInventory,
  safeTown = false,
  levelData,
} = {}) {
  requireObject(party, "party");
  requireObject(companion, "companion");
  finiteInteger(itemIndex, "itemIndex");
  requireSafeTownTransaction(party, safeTown, levelData);
  requireBenchedCompanion(party, companion);
  const destination = destinationInventory ?? party.inventory;
  if (!Array.isArray(destination)) {
    throw new TypeError("destinationInventory or party.inventory must be an array.");
  }
  const reserveBag = companion[RESERVE_BAG_KEY];
  if (itemIndex >= reserveBag.length) {
    return { transferred: false, reason: "item-index-out-of-range" };
  }
  if (destination === reserveBag) {
    throw new Error("An item cannot be transferred from a reserve bag into itself.");
  }
  const [item] = reserveBag.splice(itemIndex, 1);
  destination.push(item);
  return { transferred: true, item, reserveBagSlotsUsed: reserveBag.length };
}

export function getTrailInventory(party) {
  requireObject(party, "party");
  if (party.inventory != null && !Array.isArray(party.inventory)) {
    throw new TypeError("party.inventory must be an array.");
  }
  return party.inventory ?? [];
}

export function isDungeonRealm(levelData) {
  return levelRealmType(levelData) === DUNGEON_REALM_TYPE ||
    isKnownDungeonLevel(levelData);
}

export function getDungeonRenderOverrides(levelData, requestedMaxDistance = Infinity) {
  if (
    requestedMaxDistance !== Infinity &&
    (!Number.isFinite(requestedMaxDistance) || requestedMaxDistance < 0)
  ) {
    throw new RangeError("requestedMaxDistance must be a non-negative finite number or Infinity.");
  }
  if (!isDungeonRealm(levelData)) {
    return {
      isDungeon: false,
      maxRenderDistance: requestedMaxDistance,
      fog: null,
    };
  }
  return {
    isDungeon: true,
    maxRenderDistance: Math.min(
      requestedMaxDistance,
      DUNGEON_MAX_RENDER_DISTANCE,
    ),
    fog: Object.freeze({
      innerAlpha: 0,
      midpointAlpha: 0.42,
      outerAlpha: 0.92,
      color: "#000000",
    }),
  };
}

export function clampDungeonRenderDistance(levelData, requestedDistance) {
  if (!Number.isFinite(requestedDistance) || requestedDistance < 0) {
    throw new RangeError("requestedDistance must be a non-negative finite number.");
  }
  return getDungeonRenderOverrides(levelData, requestedDistance).maxRenderDistance;
}

export function drawDungeonDepthFog(context, canvas, levelData) {
  if (!isDungeonRealm(levelData)) {
    return false;
  }
  if (
    !context ||
    typeof context.createRadialGradient !== "function" ||
    typeof context.fillRect !== "function" ||
    !canvas ||
    !Number.isFinite(canvas.width) ||
    !Number.isFinite(canvas.height)
  ) {
    throw new TypeError("A 2D canvas context and sized canvas are required.");
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const innerRadius = Math.min(canvas.width, canvas.height) * 0.12;
  const outerRadius = Math.hypot(centerX, centerY);
  const gradient = context.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.58, "rgba(0, 0, 0, 0.42)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.92)");
  context.save?.();
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore?.();
  return true;
}

export function getVerticalTransition(entity) {
  if (
    !entity ||
    typeof entity !== "object" ||
    entity.__identifier !== "FieldInstances"
  ) {
    return null;
  }
  const fields = readEntityFields(entity);
  if (String(fields.utilityType ?? "").toUpperCase() !== "VERTICAL_TRANSITION") {
    return null;
  }
  const targetLevel = fields.target_Level;
  const spawnX = fields.spawnX;
  const spawnY = fields.spawnY;
  if (
    typeof targetLevel !== "string" ||
    targetLevel.trim().length === 0 ||
    !Number.isSafeInteger(spawnX) ||
    !Number.isSafeInteger(spawnY)
  ) {
    throw new TypeError(
      "Vertical transition requires target_Level and integer spawnX/spawnY fields.",
    );
  }
  return {
    targetLevel: targetLevel.trim().replace(/\*+$/, ""),
    requestedTargetLevel: targetLevel.trim(),
    spawnX,
    spawnY,
  };
}

export function resolveSafeLanding({
  levelData,
  x,
  y,
  previousPosition,
  gridSize,
  walkableValues = DEFAULT_WALKABLE_INTGRID_VALUES,
  interactiveEntities = [],
} = {}) {
  finiteInteger(x, "x");
  finiteInteger(y, "y");
  if (!Array.isArray(interactiveEntities)) {
    throw new TypeError("interactiveEntities must be an array.");
  }
  const values = new Set(walkableValues);
  if (values.size === 0 || [...values].some((value) => !Number.isInteger(value))) {
    throw new TypeError("walkableValues must contain integer IntGrid values.");
  }
  const { grid } = getStructuralGrid(levelData);
  const dimensions = validateRectangularGrid(grid);
  const resolvedGridSize =
    gridSize ??
    levelData?.layerInstances?.find(
      (layer) => layer?.__identifier === "Structural_Grid",
    )?.__gridSize ??
    32;
  if (!Number.isFinite(resolvedGridSize) || resolvedGridSize <= 0) {
    throw new RangeError("gridSize must be a positive finite number.");
  }
  if (!inBounds(x, y, dimensions.width, dimensions.height)) {
    throw new RangeError("Landing coordinates are outside the destination level.");
  }

  const enclosed = isEnclosedDeadEnd(
    grid,
    x,
    y,
    dimensions.width,
    dimensions.height,
    hasInteractiveEscape(levelData, x, y, resolvedGridSize, interactiveEntities),
  );
  const landingBlocked = !isWalkableCell(
    grid,
    x,
    y,
    dimensions.width,
    dimensions.height,
    values,
  );
  if (!enclosed && !landingBlocked) {
    return { safe: true, x, y, recovered: false, reason: "walkable-landing" };
  }

  if (previousPosition) {
    const previousX = finiteInteger(previousPosition.x, "previousPosition.x");
    const previousY = finiteInteger(previousPosition.y, "previousPosition.y");
    if (
      isWalkableCell(
        grid,
        previousX,
        previousY,
        dimensions.width,
        dimensions.height,
        values,
      )
    ) {
      return {
        safe: true,
        x: previousX,
        y: previousY,
        recovered: true,
        reason: enclosed ? "enclosed-landing-backstep" : "blocked-landing-backstep",
      };
    }
  }

  const fallback = findNearestWalkable(grid, { x, y }, dimensions, values);
  if (!fallback) {
    return {
      safe: false,
      x,
      y,
      recovered: false,
      reason: "destination-has-no-walkable-cell",
    };
  }
  return {
    safe: true,
    ...fallback,
    recovered: true,
    reason: enclosed ? "enclosed-landing-nearest-floor" : "blocked-landing-nearest-floor",
  };
}

function resolveLevel(levelRegistry, identifier) {
  if (levelRegistry instanceof Map) {
    return levelRegistry.get(identifier);
  }
  return levelRegistry?.[identifier];
}

export async function routeVerticalTransition({
  entity,
  levelRegistry,
  party,
  currentPosition,
  currentLevel,
  setMovementEnabled,
  loadLevel,
  onTransition,
  gridSize,
} = {}) {
  const transition = getVerticalTransition(entity);
  if (!transition) {
    return { transitioned: false, reason: "not-a-vertical-transition" };
  }
  if (typeof setMovementEnabled !== "function") {
    throw new TypeError("setMovementEnabled must freeze and restore movement listeners.");
  }
  if (typeof loadLevel !== "function") {
    throw new TypeError("loadLevel must load a destination level.");
  }
  const destinationLevel = resolveLevel(
    levelRegistry,
    transition.targetLevel,
  );
  if (!destinationLevel) {
    throw new Error(`Vertical transition destination not found: ${transition.targetLevel}.`);
  }

  setMovementEnabled(false);
  try {
    const landing = resolveSafeLanding({
      levelData: destinationLevel,
      x: transition.spawnX,
      y: transition.spawnY,
      previousPosition: currentPosition,
      gridSize,
    });
    if (!landing.safe) {
      return {
        transitioned: false,
        reason: landing.reason,
        transition,
        landing,
      };
    }

    await loadLevel(destinationLevel, {
      targetLevel: transition.targetLevel,
      x: landing.x,
      y: landing.y,
      bypassHorizontalEdgeClamping: true,
      verticalTransition: true,
    });
    if (party && typeof party === "object") {
      party.x = landing.x;
      party.y = landing.y;
      const vanguard = new Set([
        ...(party.leader ? [party.leader] : []),
        ...(Array.isArray(party.entities) ? party.entities : []),
        ...(Array.isArray(party.members) ? party.members : []),
      ]);
      for (const member of vanguard) {
        if (!member || typeof member !== "object") {
          continue;
        }
        member.x = landing.x;
        member.y = landing.y;
        if (member.position && typeof member.position === "object") {
          member.position.x = landing.x;
          member.position.y = landing.y;
        }
      }
    }
    if (typeof onTransition === "function") {
      await onTransition({
        destinationLevel,
        targetLevel: transition.targetLevel,
        x: landing.x,
        y: landing.y,
        party,
      });
    }
    return {
      transitioned: true,
      targetLevel: transition.targetLevel,
      x: landing.x,
      y: landing.y,
      landing,
    };
  } catch (error) {
    if (
      typeof process !== "undefined" &&
      process.env?.NODE_ENV === "development"
    ) {
      console.error(
        `Dungeon vertical transition to ${transition.targetLevel} failed:`,
        error,
      );
    }
    throw error;
  } finally {
    setMovementEnabled(true);
  }
}