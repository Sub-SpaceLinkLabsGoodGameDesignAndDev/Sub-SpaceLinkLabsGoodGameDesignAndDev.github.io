export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});

export const ACTION_TICKS_PER_WORLD_MINUTE = 16;
export const MINUTES_PER_WORLD_DAY = 240;
export const WALKABLE_INTGRID_VALUES = Object.freeze([
  0, 6, 7, 8, 10, 11, 13, 14, 15,
]);
const WALKABLE_TERRAIN_IDENTIFIERS = new Set([
  "WALKABLE_GRASS_MEADOW",
  "FRICTION_TAR_PIT_SWAMP",
  "LETHAL_HAZARD_LAVA_POOL",
  "PASSABLE_SPARSE_FOREST_PATH",
  "DIRT_PATHWAY_COMMONS",
  "COBBLESTONE_ROAD",
  "WOOD_PANEL_FLOOR",
  "SHALLOW_WATER",
  "SAND",
]);

const DIRECTIONS = Object.freeze({
  east: { entryDirection: "west", dir: 0 },
  west: { entryDirection: "east", dir: Math.PI },
  north: {
    entryDirection: "south",
    dir: (3 * Math.PI) / 2,
  },
  south: {
    entryDirection: "north",
    dir: Math.PI / 2,
  },
});
const fallbackClock = { worldTimeMinutes: 0 };

function getStructuralGrid(levelData) {
  if (Array.isArray(levelData?.terrainGrid)) {
    return levelData.terrainGrid;
  }

  if (Array.isArray(levelData?.map)) {
    return levelData.map;
  }

  if (Array.isArray(levelData)) {
    return levelData;
  }

  const layers = Array.isArray(levelData?.layerInstances)
    ? levelData.layerInstances
    : [];
  const gridLayer = layers.find(
    (layer) => layer?.__identifier === "Structural_Grid",
  );
  if (!gridLayer || !Array.isArray(gridLayer.intGridCsv)) {
    throw new TypeError(
      "Active level must provide a row grid or a Structural_Grid intGridCsv layer.",
    );
  }

  const width = gridLayer.__cWid;
  const height = gridLayer.__cHei;
  if (
    !Number.isInteger(width) ||
    width <= 0 ||
    !Number.isInteger(height) ||
    height <= 0 ||
    gridLayer.intGridCsv.length < width * height
  ) {
    throw new RangeError("Structural_Grid dimensions or cell data are invalid.");
  }

  return Array.from({ length: height }, (_, row) =>
    gridLayer.intGridCsv.slice(row * width, (row + 1) * width),
  );
}

export function extractMapDimensions(currentMapData) {
  const map = getStructuralGrid(currentMapData);
  const height = map.length;
  const width = Array.isArray(map[0]) ? map[0].length : 0;

  if (
    height === 0 ||
    width === 0 ||
    map.some((row) => !Array.isArray(row) || row.length !== width)
  ) {
    throw new RangeError("Active map must be a non-empty rectangular grid.");
  }

  return { height, width };
}

function getLevelGrid(levelData) {
  const grid = getStructuralGrid(levelData);
  const { height, width } = extractMapDimensions(grid);
  return { grid, height, width };
}

function getSafeZone(levelData) {
  if (levelData?.safeZone === true || levelData?.Safe_Zone === true) {
    return true;
  }

  const safeZoneField = levelData?.fieldInstances?.find(
    (field) => field?.__identifier === "Safe_Zone",
  );
  return safeZoneField?.__value === true;
}

function recoverResource(entity, currentKey, maxKey, amount) {
  const current = entity[currentKey];
  if (typeof current !== "number" || !Number.isFinite(current)) {
    return;
  }

  const maximum = entity[maxKey];
  const ceiling =
    typeof maximum === "number" && Number.isFinite(maximum)
      ? maximum
      : current;
  entity[currentKey] = Math.min(ceiling, current + amount);
}

export function applyRegenerationPulse(partyMembers, levelData) {
  if (!Array.isArray(partyMembers)) {
    throw new TypeError("partyMembers must be an array.");
  }

  const safeZone = getSafeZone(levelData);
  const recovery = safeZone
    ? { hp: 3, mp: 3, stamina: 6 }
    : { hp: 1, mp: 1, stamina: 3 };

  let recoveredCount = 0;
  for (const member of partyMembers) {
    if (
      !member ||
      typeof member !== "object" ||
      (typeof member.hp === "number" && member.hp <= 0)
    ) {
      continue;
    }

    recoverResource(member, "hp", "maxHp", recovery.hp);
    recoverResource(member, "mp", "maxMp", recovery.mp);
    recoverResource(member, "stamina", "maxStamina", recovery.stamina);
    recoveredCount += 1;
  }

  return { safeZone, recoveredCount, recovery };
}

function resolveGlobalClock() {
  if (typeof window === "undefined") {
    return fallbackClock;
  }

  if (!Number.isFinite(window.worldTimeMinutes)) {
    window.worldTimeMinutes = 0;
  }
  return window;
}

export function getWorldTimeMinutes() {
  return resolveGlobalClock()?.worldTimeMinutes ?? 0;
}

function isTimeFreeAction(actionType) {
  return /dialogue|conversation|merchant|shop/i.test(String(actionType));
}

export class CalculusClock {
  constructor({ ticksPerMinute = ACTION_TICKS_PER_WORLD_MINUTE } = {}) {
    if (!Number.isInteger(ticksPerMinute) || ticksPerMinute <= 0) {
      throw new RangeError("ticksPerMinute must be a positive integer.");
    }
    this.ticksPerMinute = ticksPerMinute;
    this.actionTicks = 0;
  }

  recordActionTick({
    actionType = "action",
    successful = true,
    partyMembers = [],
    levelData,
  } = {}) {
    if (!successful || isTimeFreeAction(actionType)) {
      return {
        advanced: false,
        actionTicks: this.actionTicks,
        worldTimeMinutes: getWorldTimeMinutes(),
      };
    }

    this.actionTicks += 1;
    if (this.actionTicks < this.ticksPerMinute) {
      return {
        advanced: false,
        actionTicks: this.actionTicks,
        worldTimeMinutes: getWorldTimeMinutes(),
      };
    }

    this.actionTicks -= this.ticksPerMinute;
    const clock = resolveGlobalClock();
    if (clock) {
      clock.worldTimeMinutes =
        clock.worldTimeMinutes >= MINUTES_PER_WORLD_DAY
          ? 0
          : clock.worldTimeMinutes + 1;
    }
    const regeneration = applyRegenerationPulse(partyMembers, levelData);

    return {
      advanced: true,
      actionTicks: this.actionTicks,
      worldTimeMinutes: getWorldTimeMinutes(),
      regeneration,
    };
  }

  resetActionTicks() {
    this.actionTicks = 0;
  }
}

export const worldActionClock = new CalculusClock();

export function recordActionTick(options) {
  return worldActionClock.recordActionTick(options);
}

export function createTraversalTracker() {
  return {
    steps: 0,
    localizedCommotionPenalty: 0,
    exhaustedHeads: 0,
    encounterNoiseMultiplier: 1,
  };
}

export const worldTraversalTracker = createTraversalTracker();

export function recordTraversalStep(
  partyMembers,
  tracker = worldTraversalTracker,
) {
  if (!Array.isArray(partyMembers)) {
    throw new TypeError("partyMembers must be an array.");
  }

  const exhaustedHeads = partyMembers.filter(
    (member) =>
      member &&
      typeof member === "object" &&
      typeof member.stamina === "number" &&
      member.stamina <= 0 &&
      !(typeof member.hp === "number" && member.hp <= 0),
  ).length;

  tracker.steps += 1;
  tracker.exhaustedHeads = exhaustedHeads;
  tracker.localizedCommotionPenalty += exhaustedHeads * 0.15;
  tracker.encounterNoiseMultiplier =
    1 + tracker.localizedCommotionPenalty;

  return tracker;
}

function getEntityGridPosition(entity, gridSize) {
  if (
    Array.isArray(entity?.__grid) &&
    Number.isFinite(entity.__grid[0]) &&
    Number.isFinite(entity.__grid[1])
  ) {
    return { x: entity.__grid[0], y: entity.__grid[1] };
  }

  if (
    Array.isArray(entity?.px) &&
    Number.isFinite(entity.px[0]) &&
    Number.isFinite(entity.px[1])
  ) {
    return {
      x: Math.floor(entity.px[0] / gridSize),
      y: Math.floor(entity.px[1] / gridSize),
    };
  }

  return null;
}

function getLevelEntities(levelData) {
  return (levelData?.layerInstances ?? []).flatMap((layer) =>
    Array.isArray(layer?.entityInstances) ? layer.entityInstances : [],
  );
}

function fieldValue(entity, fieldName) {
  return entity?.fieldInstances?.find(
    (field) => field?.__identifier === fieldName,
  )?.__value;
}

function findBoundaryPortal(levelData, direction, secondaryCoordinate, gridSize) {
  const { width, height } = extractMapDimensions(levelData);
  const position = DIRECTIONS[direction];
  const secondaryIndex = Math.floor(secondaryCoordinate);
  const portals = getLevelEntities(levelData)
    .filter((entity) => entity?.__identifier === "Zone_Exit")
    .map((entity) => ({
      entity,
      position: getEntityGridPosition(entity, gridSize),
    }))
    .filter(({ entity, position: gridPosition }) => {
      if (!gridPosition) {
        return false;
      }
      const onEdge =
        direction === "east"
          ? gridPosition.x >= width - 1
          : direction === "west"
            ? gridPosition.x <= 0
            : direction === "north"
              ? gridPosition.y <= 0
              : gridPosition.y >= height - 1;
      const entitySecondary =
        direction === "east" || direction === "west"
          ? gridPosition.y
          : gridPosition.x;
      return (
        onEdge &&
        Math.abs(entitySecondary - secondaryIndex) <= 1 &&
        typeof fieldValue(entity, "targetMapFile") === "string" &&
        fieldValue(entity, "targetMapFile").length > 0
      );
    })
    .sort((first, second) => {
      const firstPos = first.position;
      const secondPos = second.position;
      const firstSecondary =
        direction === "east" || direction === "west"
          ? firstPos.y
          : firstPos.x;
      const secondSecondary =
        direction === "east" || direction === "west"
          ? secondPos.y
          : secondPos.x;
      return (
        Math.abs(firstSecondary - secondaryIndex) -
        Math.abs(secondSecondary - secondaryIndex)
      );
    });

  if (portals.length > 0) {
    return {
      target: fieldValue(portals[0].entity, "targetMapFile"),
      entity: portals[0].entity,
      direction,
      entryDirection: position.entryDirection,
    };
  }

  const neighbor = levelData?.__neighbours?.find(
    (entry) => entry?.dir === direction[0],
  );
  if (neighbor) {
    return {
      target: neighbor.levelIid,
      direction,
      entryDirection: position.entryDirection,
      targetIsIid: true,
    };
  }

  return null;
}

function isWalkable(grid, x, y) {
  const row = grid[y];
  const tile = row?.[x];
  return (
    Array.isArray(row) &&
    (WALKABLE_INTGRID_VALUES.includes(tile) ||
      WALKABLE_TERRAIN_IDENTIFIERS.has(tile))
  );
}

function findLandingCell(grid, direction, primaryIndex, secondaryIndex) {
  const { length: height } = grid;
  const width = grid[0].length;
  const horizontalRail = direction === "east" || direction === "west";
  const railLength = horizontalRail ? height : width;
  const candidateOffsets = [0];

  for (let offset = 1; offset < railLength; offset += 1) {
    candidateOffsets.push(-offset, offset);
  }

  for (const offset of candidateOffsets) {
    const varyingIndex = secondaryIndex + offset;
    if (varyingIndex < 0 || varyingIndex >= railLength) {
      continue;
    }

    const x = horizontalRail ? primaryIndex : varyingIndex;
    const y = horizontalRail ? varyingIndex : primaryIndex;
    if (isWalkable(grid, x, y)) {
      return { x: x + 0.5, y: y + 0.5 };
    }
  }

  return null;
}

function applyLandingRail(player, targetLevel, direction) {
  const { grid, width, height } = getLevelGrid(targetLevel);
  const horizontalRail = direction === "east" || direction === "west";
  const primaryIndex =
    direction === "east"
      ? 0
      : direction === "west"
        ? width - 1
        : direction === "south"
          ? 0
          : height - 1;
  const secondaryCoordinate = horizontalRail ? player.y : player.x;
  const secondaryLimit = horizontalRail ? height : width;
  const boundedSecondary = Math.min(
    secondaryLimit - 0.5,
    Math.max(0.5, secondaryCoordinate),
  );
  const landing = findLandingCell(
    grid,
    direction,
    primaryIndex,
    Math.floor(boundedSecondary),
  );

  if (!landing) {
    throw new Error(
      `No walkable landing cell was found along the ${direction} entry rail.`,
    );
  }

  player.x = landing.x;
  player.y = landing.y;
  player.dir = DIRECTIONS[direction].dir;
  return { width, height, ...landing };
}

export async function loadNewWorldZone({
  target,
  direction,
  player,
  loadZone,
  currentLevel,
  targetIsIid = false,
  gridSize = 32,
}) {
  if (typeof target !== "string" || target.length === 0) {
    throw new TypeError("A target level identifier or path is required.");
  }
  if (!player || typeof player !== "object") {
    throw new TypeError("A player object is required for a zone transition.");
  }
  if (typeof loadZone !== "function") {
    throw new TypeError("loadZone must be a function that loads the target zone.");
  }
  if (!DIRECTIONS[direction]) {
    throw new RangeError(`Unsupported boundary direction: ${direction}.`);
  }

  const targetLevel = await loadZone(target, {
    currentLevel,
    direction,
    targetIsIid,
  });
  if (!targetLevel || typeof targetLevel !== "object") {
    throw new TypeError(`Zone loader returned invalid data for "${target}".`);
  }

  const landing = applyLandingRail(player, targetLevel, direction);
  return { level: targetLevel, landing, target };
}

export async function routeBoundaryTransition({
  player,
  currentLevel,
  direction,
  loadZone,
  gridSize = 32,
}) {
  if (!DIRECTIONS[direction]) {
    throw new RangeError(`Unsupported boundary direction: ${direction}.`);
  }

  const secondaryCoordinate =
    direction === "east" || direction === "west" ? player.y : player.x;
  const portal = findBoundaryPortal(
    currentLevel,
    direction,
    secondaryCoordinate,
    gridSize,
  );
  if (!portal) {
    throw new Error(`No adjacent destination was found at the ${direction} edge.`);
  }
  return loadNewWorldZone({
    target: portal.target,
    direction,
    player,
    loadZone,
    currentLevel,
    targetIsIid: portal.targetIsIid === true,
    gridSize,
  });
}

function boundaryDirection(x, y, width, height) {
  if (x < 0) return "west";
  if (x >= width) return "east";
  if (y < 0) return "north";
  if (y >= height) return "south";
  return null;
}

export async function handlePlayerMovementPhysics({
  player,
  dx,
  dy,
  currentLevel,
  loadZone,
  partyMembers = [],
  traversalTracker = worldTraversalTracker,
  gridSize = 32,
}) {
  if (!player || typeof player !== "object") {
    throw new TypeError("A player object is required.");
  }
  if (
    !Number.isFinite(player.x) ||
    !Number.isFinite(player.y) ||
    !Number.isFinite(dx) ||
    !Number.isFinite(dy)
  ) {
    throw new TypeError("Player coordinates and movement deltas must be finite.");
  }

  const { grid, width, height } = getLevelGrid(currentLevel);
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  const direction = boundaryDirection(nextX, nextY, width, height);

  if (direction) {
    if (typeof loadZone !== "function") {
      throw new TypeError("loadZone is required to cross a map boundary.");
    }
    const transition = await routeBoundaryTransition({
      player: { ...player, x: nextX, y: nextY },
      currentLevel,
      direction,
      loadZone,
      gridSize,
    });
    player.x = transition.landing.x;
    player.y = transition.landing.y;
    player.dir = DIRECTIONS[direction].dir;
    recordTraversalStep(partyMembers, traversalTracker);
    const clock = recordActionTick({
      actionType: "traversal",
      partyMembers,
      levelData: transition.level,
    });
    return {
      moved: true,
      transitioned: true,
      traversalTracker,
      clock,
      ...transition,
    };
  }

  const targetX = Math.floor(nextX);
  const targetY = Math.floor(nextY);
  if (!isWalkable(grid, targetX, targetY)) {
    return { moved: false, transitioned: false, reason: "blocked" };
  }

  player.x = nextX;
  player.y = nextY;
  recordTraversalStep(partyMembers, traversalTracker);
  const clock = recordActionTick({
    actionType: "traversal",
    partyMembers,
    levelData: currentLevel,
  });

  return {
    moved: true,
    transitioned: false,
    width,
    height,
    traversalTracker,
    clock,
  };
}