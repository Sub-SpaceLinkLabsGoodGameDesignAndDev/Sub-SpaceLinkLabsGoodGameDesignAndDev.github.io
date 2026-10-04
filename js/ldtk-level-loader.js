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

export function createLdtkRuntimeLevel(
  project,
  level,
  { spawnIdentifier = "PLAYER_SPAWN" } = {},
) {
  if (!project?.defs?.layers || !Array.isArray(project.defs.layers)) {
    throw new TypeError("LDtk project is missing layer definitions.");
  }
  const spawnDefinition = project.defs.entities?.find(
    (entity) => entity.identifier === spawnIdentifier,
  );
  if (!spawnDefinition) {
    throw new TypeError(`LDtk project is missing the ${spawnIdentifier} definition.`);
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

  const spawnEntities = level.layerInstances.flatMap((layer) =>
    (layer.entityInstances ?? [])
      .filter((entity) => entity.__identifier === spawnIdentifier)
      .map((entity) => ({ ...entity, layerIdentifier: layer.__identifier })),
  );
  if (spawnEntities.length !== 1) {
    throw new RangeError(
      `LDtk level must contain exactly one ${spawnIdentifier} entity; found ${spawnEntities.length}.`,
    );
  }

  const spawnEntity = spawnEntities[0];
  if (spawnEntity.defUid !== spawnDefinition.uid) {
    throw new RangeError(`${spawnIdentifier} instance has a mismatched definition uid.`);
  }
  const [spawnX, spawnY] = spawnEntity.__grid ?? [];
  if (
    !Number.isInteger(spawnX) ||
    !Number.isInteger(spawnY) ||
    spawnX < 0 ||
    spawnX >= width ||
    spawnY < 0 ||
    spawnY >= height
  ) {
    throw new RangeError(`${spawnIdentifier} must be placed inside Structural_Grid.`);
  }
  if (terrainGrid[spawnY][spawnX] !== "COBBLESTONE_ROAD") {
    throw new RangeError(`${spawnIdentifier} must be placed on COBBLESTONE_ROAD.`);
  }

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
    spawn: { x: spawnX + 0.5, y: spawnY + 0.5 },
  };
}

export async function loadLdtkRuntimeLevel({
  projectUrl = "src/data/world/realms_of_infinity.ldtk",
  levelUrl = "src/data/world/realms_of_infinity/Oakhaven_1.ldtkl",
  fetchImpl = fetch,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("fetchImpl must be a function.");
  }

  const [projectResponse, levelResponse] = await Promise.all([
    fetchImpl(projectUrl).then((response) => assertResponse(response, projectUrl)),
    fetchImpl(levelUrl).then((response) => assertResponse(response, levelUrl)),
  ]);
  const [project, level] = await Promise.all([
    projectResponse.json(),
    levelResponse.json(),
  ]);
  return createLdtkRuntimeLevel(project, level);
}
