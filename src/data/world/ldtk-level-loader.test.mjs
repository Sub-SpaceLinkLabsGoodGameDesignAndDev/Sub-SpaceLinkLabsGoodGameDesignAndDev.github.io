import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loaderSource = await readFile(
  new URL("../../../js/ldtk-level-loader.js", import.meta.url),
  "utf8",
);
const { createLdtkRuntimeLevel } = await import(
  `data:text/javascript;base64,${Buffer.from(loaderSource).toString("base64")}`
);
const project = JSON.parse(
  await readFile(new URL("./realms_of_infinity.ldtk", import.meta.url), "utf8"),
);
const oakhaven = JSON.parse(
  await readFile(
    new URL("./realms_of_infinity/Oakhaven_1.ldtkl", import.meta.url),
    "utf8",
  ),
);

test("Oakhaven loads its authored grid, safe-zone field, and marked spawn", () => {
  const level = createLdtkRuntimeLevel(project, oakhaven);

  assert.equal(level.identifier, "Oakhaven_1");
  assert.equal(level.safeZone, true);
  assert.deepEqual(level.spawn, { x: 15.5, y: 30.5 });
  assert.equal(level.terrainGrid[30][15], "COBBLESTONE_ROAD");
  assert.equal(level.collisionGrid[30][15], 0);
  assert.equal(level.spawnSource, "ldtk");
  assert.equal(level.spawnFallbackReason, null);
});

test("IntGrid identifiers preserve blocking walls, closed doors, and passable terrain", () => {
  const level = createLdtkRuntimeLevel(project, oakhaven);

  assert.equal(level.terrainGrid[0][0], "SOLID_STRUCTURAL_WALL");
  assert.equal(level.collisionGrid[0][0], 1);
  assert.equal(level.terrainGrid[29][15], "COBBLESTONE_ROAD");
  assert.equal(level.collisionGrid[29][15], 0);
});

test("IntGrid values 1 through 15 use the authored blocking and walkability rules", () => {
  const structuralDefinition = project.defs.layers.find(
    (layer) => layer.identifier === "Structural_Grid",
  );
  const syntheticLevel = {
    identifier: "TileRules",
    fieldInstances: [{ __identifier: "Safe_Zone", __value: false }],
    layerInstances: [
      {
        __identifier: "Structural_Grid",
        layerDefUid: structuralDefinition.uid,
        __cWid: 16,
        __cHei: 1,
        intGridCsv: Array.from({ length: 16 }, (_, value) => value),
      },
      {
        __identifier: "Actors",
        entityInstances: [
          {
            __identifier: "ZONE_IN_LOCATION",
            __grid: [11, 0],
            defUid: project.defs.entities.find(
              (entity) => entity.identifier === "ZONE_IN_LOCATION",
            ).uid,
            fieldInstances: [
              { __identifier: "Zone_In", __value: "PLAYER_SPAWN" },
            ],
          },
        ],
      },
    ],
  };
  const level = createLdtkRuntimeLevel(project, syntheticLevel);

  assert.deepEqual(level.collisionGrid[0], [
    0, 1, 2, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0,
  ]);
  assert.equal(level.terrainGrid[0][3], "CAVE_WALL");
});

test("missing or duplicate authored spawn markers use a walkable fallback", () => {
  const noSpawn = structuredClone(oakhaven);
  for (const layer of noSpawn.layerInstances) {
    layer.entityInstances = (layer.entityInstances ?? []).filter(
      (entity) =>
        !entity.fieldInstances?.some(
          (field) =>
            field.__identifier === "Zone_In" &&
            field.__value === "PLAYER_SPAWN",
        ),
    );
  }
  const missingMarkerLevel = createLdtkRuntimeLevel(project, noSpawn);
  assert.equal(missingMarkerLevel.spawnSource, "engine-fallback");
  assert.match(missingMarkerLevel.spawnFallbackReason, /found 0/);
  assert.equal(
    missingMarkerLevel.collisionGrid
      [Math.floor(missingMarkerLevel.spawn.y)]
      [Math.floor(missingMarkerLevel.spawn.x)],
    0,
  );

  const duplicateSpawn = structuredClone(oakhaven);
  const markedSpawn = duplicateSpawn.layerInstances
    .flatMap((layer) => layer.entityInstances ?? [])
    .find((entity) =>
      entity.fieldInstances?.some(
        (field) =>
          field.__identifier === "Zone_In" &&
          field.__value === "PLAYER_SPAWN",
      ),
    );
  const spawnLayer = duplicateSpawn.layerInstances.find(
    (layer) => layer.__identifier === "Actors",
  );
  spawnLayer.entityInstances.push(structuredClone(markedSpawn));
  const duplicateMarkerLevel = createLdtkRuntimeLevel(project, duplicateSpawn);
  assert.equal(duplicateMarkerLevel.spawnSource, "engine-fallback");
  assert.match(duplicateMarkerLevel.spawnFallbackReason, /found 2/);
});

test("blocked authored spawn marker falls back to the nearest walkable cell", () => {
  const blockedSpawn = structuredClone(oakhaven);
  const gridLayer = blockedSpawn.layerInstances.find(
    (layer) => layer.__identifier === "Structural_Grid",
  );
  gridLayer.intGridCsv[30 * gridLayer.__cWid + 15] = 1;

  const level = createLdtkRuntimeLevel(project, blockedSpawn);

  assert.equal(level.spawnSource, "engine-fallback");
  assert.match(level.spawnFallbackReason, /blocked terrain/);
  assert.equal(
    level.collisionGrid[Math.floor(level.spawn.y)][Math.floor(level.spawn.x)],
    0,
  );
});
