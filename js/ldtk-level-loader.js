const BLOCKING_TERRAIN = new Set([
  "SOLID_STRUCTURAL_WALL",
  "INTERIOR_DOORWAY_GATE",
  "CAVE_WALL",
  "IMPASSABLE_MOUNTAIN_BARRIER",
  "IMPASSABLE_MOUNTAIN_BORDER",
  "DENSE_BLOCKING_FLORA_TREES",
  "DEEP_WATER_IMPASSABLE",
  "WOOD_PANEL_WALL",
]);

const WALKABLE_TERRAIN = new Set([
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

function assertResponse(response, url) {
  if (!response.ok) {
    throw new Error(`Unable to load LDtk data from ${url}: HTTP ${response.status}.`);
  }
  return response;
}

function getLevelFieldValue(fields, identifier) {
  return fields?.find((field) => field.__identifier === identifier)?.__value;
}

function getWorldLevelDescriptors(project, worldIdentifier, clusterIdentifier) {
  const world = project.worlds?.find(
    (candidate) => candidate.identifier === worldIdentifier,
  );
  if (!world || !Array.isArray(world.levels)) {
    throw new TypeError(
      `LDtk project is missing the ${worldIdentifier} world level index.`,
    );
  }

  return world.levels.filter(
    (level) =>
      getLevelFieldValue(level.fieldInstances, "Transition_Cluster") ===
      clusterIdentifier,
  );
}

function resolveExternalLevelUrl(projectUrl, externalRelPath) {
  const projectDirectory = projectUrl.slice(
    0,
    projectUrl.lastIndexOf("/") + 1,
  );
  return `${projectDirectory}${externalRelPath.replace(/\\/g, "/")}`;
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, { cache: "no-store" });
  return assertResponse(response, url).json();
}

export function createLdtkRuntimeLevel(
  project,
  level,
  {
    spawnIdentifier = "ZONE_IN_LOCATION",
    spawnFieldIdentifier = "Zone_In",
    spawnFieldValue = "PLAYER_SPAWN",
  } = {},
) {
  if (!project?.defs?.layers || !Array.isArray(project.defs.layers)) {
    throw new TypeError("LDtk project is missing layer definitions.");
  }
  if (!Array.isArray(level?.layerInstances)) {
    throw new TypeError("LDtk level is missing layer instances.");
  }

  const gridLayer = level.layerInstances.find(
    (layer) => layer.__identifier === "Structural_Grid",
  );
  if (!gridLayer || !Array.isArray(gridLayer.intGridCsv)) {
    throw new TypeError("LDtk level is missing its Structural_Grid IntGrid.");
  }

  const gridDefinition = project.defs.layers.find(
    (layer) => layer.uid === gridLayer.layerDefUid,
  );
  if (!gridDefinition || !Array.isArray(gridDefinition.intGridValues)) {
    throw new TypeError("LDtk Structural_Grid definition is invalid.");
  }

  const { __cWid: width, __cHei: height } = gridLayer;
  if (
    !Number.isInteger(width) ||
    width <= 0 ||
    !Number.isInteger(height) ||
    height <= 0 ||
    gridLayer.intGridCsv.length !== width * height
  ) {
    throw new RangeError("LDtk Structural_Grid dimensions do not match its cells.");
  }

  const identifiersByValue = new Map(
    gridDefinition.intGridValues.map(({ value, identifier }) => [
      value,
      identifier,
    ]),
  );
  const structuralGrid = Array.from({ length: height }, (_, y) =>
    gridLayer.intGridCsv.slice(y * width, (y + 1) * width),
  );
  const terrainGrid = structuralGrid.map((row) =>
    row.map((value) =>
      value === 0
        ? "WALKABLE_GRASS_MEADOW"
        : (identifiersByValue.get(value) ?? null),
    ),
  );

  const collisionGrid = terrainGrid.map((row) =>
    row.map((identifier) => {
      if (identifier === "INTERIOR_DOORWAY_GATE") return 2;
      if (BLOCKING_TERRAIN.has(identifier)) return 1;
      return WALKABLE_TERRAIN.has(identifier) ? 0 : 1;
    }),
  );

  const spawnDefinition = project.defs.entities?.find(
    (entity) => entity.identifier === spawnIdentifier,
  );
  const spawnEntities = level.layerInstances.flatMap((layer) =>
    (layer.entityInstances ?? [])
      .filter(
        (entity) =>
          entity.__identifier === spawnIdentifier &&
          entity.fieldInstances?.some(
            (field) =>
              field.__identifier === spawnFieldIdentifier &&
              field.__value === spawnFieldValue,
          ),
      )
      .map((entity) => ({ ...entity, layerIdentifier: layer.__identifier })),
  );

  const isWalkableCell = (x, y) =>
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < width &&
    y >= 0 &&
    y < height &&
    collisionGrid[y][x] === 0;
  const markerIsUsable =
    spawnEntities.length === 1 &&
    spawnDefinition &&
    spawnEntities[0].defUid === spawnDefinition.uid &&
    isWalkableCell(...(spawnEntities[0].__grid ?? []));
  const spawnMarker = markerIsUsable ? spawnEntities[0] : null;
  const candidateAnchor =
    spawnEntities.length === 1 ? spawnEntities[0].__grid : null;
  const fallbackAnchor =
    Array.isArray(candidateAnchor) &&
    Number.isFinite(candidateAnchor[0]) &&
    Number.isFinite(candidateAnchor[1])
      ? candidateAnchor
      : [Math.floor(width / 2), Math.floor(height / 2)];
  const spawnCell = spawnMarker
    ? spawnMarker.__grid
    : findNearestWalkableCell(collisionGrid, fallbackAnchor);
  if (!spawnCell) {
    throw new RangeError(
      `LDtk level "${level.identifier}" has no walkable cell for a player spawn.`,
    );
  }
  const spawnFallbackReason = spawnMarker
    ? null
    : spawnEntities.length !== 1
      ? `expected exactly one ${spawnFieldValue} marker; found ${spawnEntities.length}`
      : !spawnDefinition || spawnEntities[0].defUid !== spawnDefinition.uid
        ? `${spawnIdentifier} marker definition is missing or mismatched`
        : `${spawnFieldValue} marker is outside the grid or on blocked terrain`;

  const safeZoneField = level.fieldInstances?.find(
    (field) => field.__identifier === "Safe_Zone",
  );
  const entities = level.layerInstances.flatMap((layer) =>
    (layer.entityInstances ?? []).map((entity) => ({
      ...entity,
      layerIdentifier: layer.__identifier,
    })),
  );

  return {
    identifier: level.identifier,
    iid: level.iid,
    externalRelPath: level.externalRelPath,
    worldX: level.worldX,
    worldY: level.worldY,
    gridSize: gridLayer.__gridSize,
    transitionCluster: getLevelFieldValue(
      level.fieldInstances,
      "Transition_Cluster",
    ),
    neighbors: level.__neighbours ?? [],
    width,
    height,
    safeZone:
      typeof safeZoneField?.__value === "boolean"
        ? safeZoneField.__value
        : null,
    structuralGrid,
    terrainGrid,
    map: terrainGrid,
    collisionGrid,
    entities,
    spawn: { x: spawnCell[0] + 0.5, y: spawnCell[1] + 0.5 },
    spawnSource: spawnMarker ? "ldtk" : "engine-fallback",
    spawnFallbackReason,
  };
}

function findNearestWalkableCell(collisionGrid, [anchorX, anchorY]) {
  let nearestCell = null;
  let nearestDistance = Infinity;

  for (let y = 0; y < collisionGrid.length; y += 1) {
    for (let x = 0; x < collisionGrid[y].length; x += 1) {
      if (collisionGrid[y][x] !== 0) continue;
      const distance = Math.abs(x - anchorX) + Math.abs(y - anchorY);
      if (distance < nearestDistance) {
        nearestCell = [x, y];
        nearestDistance = distance;
      }
    }
  }

  return nearestCell;
}

export async function loadLdtkRuntimeWorld({
  projectUrl = "src/data/world/realms_of_infinity.ldtk",
  worldIdentifier = "Town_1",
  clusterIdentifier = "Town_1",
  initialLevelIdentifier = "Oakhaven_1",
  fetchImpl = fetch,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function.");
  }

  const project = await fetchJson(projectUrl, fetchImpl);
  const descriptors = getWorldLevelDescriptors(
    project,
    worldIdentifier,
    clusterIdentifier,
  );
  if (descriptors.length === 0) {
    throw new RangeError(
      `LDtk world "${worldIdentifier}" has no levels in the "${clusterIdentifier}" transition cluster.`,
    );
  }

  const levels = await Promise.all(
    descriptors.map(async (descriptor) => {
      if (
        typeof descriptor.externalRelPath !== "string" ||
        descriptor.externalRelPath.length === 0
      ) {
        throw new TypeError(
          `LDtk level "${descriptor.identifier}" has no external level path.`,
        );
      }

      const levelUrl = resolveExternalLevelUrl(
        projectUrl,
        descriptor.externalRelPath,
      );
      const sourceLevel = await fetchJson(levelUrl, fetchImpl);
      if (
        sourceLevel.identifier !== descriptor.identifier ||
        sourceLevel.iid !== descriptor.iid
      ) {
        throw new RangeError(
          `LDtk level file "${levelUrl}" does not match its project descriptor.`,
        );
      }
      if (
        getLevelFieldValue(sourceLevel.fieldInstances, "Transition_Cluster") !==
        clusterIdentifier
      ) {
        return null;
      }
      return createLdtkRuntimeLevel(project, sourceLevel);
    }),
  );
  const runtimeLevels = levels.filter(Boolean);
  const levelsByIdentifier = new Map(
    runtimeLevels.map((level) => [level.identifier, level]),
  );
  const levelsByIid = new Map(
    runtimeLevels.map((level) => [level.iid, level]),
  );
  const initialLevel = levelsByIdentifier.get(initialLevelIdentifier);
  if (!initialLevel) {
    throw new RangeError(
      `Initial LDtk level "${initialLevelIdentifier}" is not available in the "${clusterIdentifier}" transition cluster.`,
    );
  }

  return {
    project,
    levels: runtimeLevels,
    levelsByIdentifier,
    levelsByIid,
    initialLevel,
  };
}

export async function loadLdtkRuntimeLevel({
  projectUrl,
  worldIdentifier,
  clusterIdentifier,
  initialLevelIdentifier,
  fetchImpl = fetch,
} = {}) {
  const world = await loadLdtkRuntimeWorld({
    projectUrl,
    worldIdentifier,
    clusterIdentifier,
    initialLevelIdentifier,
    fetchImpl,
  });
  return world.initialLevel;
}
