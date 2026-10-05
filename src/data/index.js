export const studioIdentity = Object.freeze({
  businessStructure: "sole proprietorship",
  proprietor: "Josh Wade",
  legalOwner: "Josh Wade",
  studio: "SSLLGGD&D\u2122",
});



const PROJECT_URL = new URL("./world/realms_of_infinity.ldtk", import.meta.url);
const REGISTRY_IDENTIFIER = "DATABASE_REGISTRY";

let initializationId = 0;

function warnInvalidField(entityIdentifier, fieldName) {
  console.warn(
    `Invalid ${fieldName} field on ${entityIdentifier}; using its default value.`,
  );
}

function readFieldMap(entity) {
  const fields = Object.create(null);

  if (!Array.isArray(entity.fieldInstances)) {
    return fields;
  }

  for (const field of entity.fieldInstances) {
    if (
      field &&
      typeof field.__identifier === "string" &&
      field.__identifier.length > 0
    ) {
      fields[field.__identifier] = field.__value;
    }
  }

  return fields;
}

function readString(value, fallback, entityIdentifier, fieldName) {
  if (typeof value === "string") {
    return value;
  }

  if (value != null) {
    warnInvalidField(entityIdentifier, fieldName);
  }

  return fallback;
}

function readNumber(value, fallback, entityIdentifier, fieldName) {
  const parsed = typeof value === "string" ? Number(value) : value;

  if (typeof parsed === "number" && Number.isFinite(parsed)) {
    return parsed;
  }

  if (value != null) {
    warnInvalidField(entityIdentifier, fieldName);
  }

  return fallback;
}

function readJsonField(value, fallback, entityIdentifier, fieldName) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      warnInvalidField(entityIdentifier, fieldName);
      return fallback;
    }
  }

  return value == null ? fallback : value;
}

function readObjectField(value, entityIdentifier, fieldName) {
  const parsed = readJsonField(value, {}, entityIdentifier, fieldName);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }

  warnInvalidField(entityIdentifier, fieldName);
  return {};
}

function readArrayField(value, entityIdentifier, fieldName) {
  const parsed = readJsonField(value, [], entityIdentifier, fieldName);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  warnInvalidField(entityIdentifier, fieldName);
  return [];
}

function readTileRect(entity, fields, entityIdentifier) {
  const candidate =
    entity.tileRect ??
    fields.tileRect ??
    (entity.__tile && {
      tilesetUid: entity.__tile.tilesetUid,
      x: entity.__tile.x,
      y: entity.__tile.y,
      w: entity.__tile.w,
      h: entity.__tile.h,
    });
  const parsed = readJsonField(
    candidate,
    null,
    entityIdentifier,
    "tileRect",
  );

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Number.isFinite(parsed.tilesetUid) ||
    !Number.isFinite(parsed.x) ||
    !Number.isFinite(parsed.y) ||
    !Number.isFinite(parsed.w) ||
    !Number.isFinite(parsed.h) ||
    parsed.x < 0 ||
    parsed.y < 0 ||
    parsed.w <= 0 ||
    parsed.h <= 0
  ) {
    if (candidate != null) {
      warnInvalidField(entityIdentifier, "tileRect");
    }
    return null;
  }

  return {
    tilesetUid: parsed.tilesetUid,
    x: parsed.x,
    y: parsed.y,
    w: parsed.w,
    h: parsed.h,
  };
}

function addSpritePointers(record, entity, fields, entityIdentifier) {
  const tileRect = readTileRect(entity, fields, entityIdentifier);
  if (tileRect) {
    record.tileRect = tileRect;
  }

  const spriteAssetPath = readString(
    fields.spriteAssetPath ?? entity.spriteAssetPath,
    "",
    entityIdentifier,
    "spriteAssetPath",
  );

  if (spriteAssetPath.length > 0) {
    record.spriteAssetPath = spriteAssetPath;

    if (typeof Image !== "undefined") {
      try {
        const spriteImage = new Image();
        spriteImage.src = spriteAssetPath;
        record.spriteImage = spriteImage;
      } catch (error) {
        console.error(
          `Unable to initialize sprite image for ${entityIdentifier}.`,
          error,
        );
      }
    }
  }
}

function createRecord(entity, index, itemDatabase, monsterDatabase) {
  if (!entity || typeof entity !== "object") {
    return;
  }

  const entityIdentifier = entity.__identifier;
  if (entityIdentifier !== "WEAPON" && entityIdentifier !== "MONSTER") {
    return;
  }

  const fields = readFieldMap(entity);
  const fallbackId =
    typeof entity.iid === "string" && entity.iid.length > 0
      ? entity.iid
      : `${entityIdentifier.toLowerCase()}-${index}`;
  const extractedId = readString(
    fields.id,
    fallbackId,
    entityIdentifier,
    "id",
  );
  const record = {
    id: extractedId.length > 0 ? extractedId : fallbackId,
    name: readString(fields.name, "", entityIdentifier, "name"),
  };

  if (entityIdentifier === "WEAPON") {
    Object.assign(record, {
      qualityTier: readNumber(
        fields.qualityTier,
        0,
        entityIdentifier,
        "qualityTier",
      ),
      accuracy: readNumber(
        fields.accuracy,
        0,
        entityIdentifier,
        "accuracy",
      ),
      handsRequired: readNumber(
        fields.handsRequired,
        0,
        entityIdentifier,
        "handsRequired",
      ),
      damageSplit: readObjectField(
        fields.damageSplit,
        entityIdentifier,
        "damageSplit",
      ),
      statModifiers: readObjectField(
        fields.statModifiers,
        entityIdentifier,
        "statModifiers",
      ),
      description: readString(
        fields.description,
        "",
        entityIdentifier,
        "description",
      ),
    });
    addSpritePointers(record, entity, fields, entityIdentifier);
    Object.defineProperty(itemDatabase, record.id, {
      configurable: true,
      enumerable: true,
      value: record,
      writable: true,
    });
    return;
  }

  const goldRange = readJsonField(
    fields.goldRange,
    [],
    entityIdentifier,
    "goldRange",
  );
  const normalizedGoldRange =
    goldRange && typeof goldRange === "object" ? goldRange : [];
  if (goldRange != null && normalizedGoldRange !== goldRange) {
    warnInvalidField(entityIdentifier, "goldRange");
  }

  Object.assign(record, {
    level: readNumber(fields.level, 0, entityIdentifier, "level"),
    baseHp: readNumber(fields.baseHp, 0, entityIdentifier, "baseHp"),
    baseXpReward: readNumber(
      fields.baseXpReward,
      0,
      entityIdentifier,
      "baseXpReward",
    ),
    goldRange: normalizedGoldRange,
    personality: readString(
      fields.personality,
      "",
      entityIdentifier,
      "personality",
    ),
    tags: readArrayField(fields.tags, entityIdentifier, "tags"),
  });
  addSpritePointers(record, entity, fields, entityIdentifier);
  Object.defineProperty(monsterDatabase, record.id, {
    configurable: true,
    enumerable: true,
    value: record,
    writable: true,
  });
}

function findRegistryLevel(project) {
  const levels = [
    ...(Array.isArray(project.levels) ? project.levels : []),
    ...(Array.isArray(project.worlds)
      ? project.worlds.flatMap((world) =>
          Array.isArray(world?.levels) ? world.levels : [],
        )
      : []),
  ];

  return levels.find((level) => level?.identifier === REGISTRY_IDENTIFIER);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`LDtk data request failed with status ${response.status}.`);
  }
  return response.json();
}

function replaceDatabase(target, source) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  for (const [key, value] of Object.entries(source)) {
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
  }
}

export async function initDataDb() {
  const currentInitializationId = ++initializationId;

  try {
    const project = await fetchJson(PROJECT_URL);
    if (!project || typeof project !== "object") {
      throw new TypeError("LDtk project payload must be an object.");
    }

    const registryLevel = findRegistryLevel(project);
    if (!registryLevel) {
      if (currentInitializationId === initializationId) {
        replaceDatabase(ITEM_DATABASE, {});
        replaceDatabase(MONSTER_DATABASE, {});
      }
      console.warn(
        `LDtk project has no ${REGISTRY_IDENTIFIER} level; data registries remain empty.`,
      );
      return { initialized: true, registryFound: false };
    }

    let levelPayload = registryLevel;
    if (typeof registryLevel.externalRelPath === "string") {
      levelPayload = await fetchJson(
        new URL(registryLevel.externalRelPath, PROJECT_URL),
      );
    }

    const layers = Array.isArray(levelPayload?.layerInstances)
      ? levelPayload.layerInstances
      : [];
    const nextItems = {};
    const nextMonsters = {};
    let entityIndex = 0;

    for (const layer of layers) {
      const entities = Array.isArray(layer?.entityInstances)
        ? layer.entityInstances
        : [];
      for (const entity of entities) {
        createRecord(entity, entityIndex, nextItems, nextMonsters);
        entityIndex += 1;
      }
    }

    if (currentInitializationId === initializationId) {
      replaceDatabase(ITEM_DATABASE, nextItems);
      replaceDatabase(MONSTER_DATABASE, nextMonsters);
    }

    return {
      initialized: true,
      registryFound: true,
      itemCount: Object.keys(nextItems).length,
      monsterCount: Object.keys(nextMonsters).length,
    };
  } catch (error) {
    console.error(
      "LDtk data initialization failed; retaining current registries.",
      error,
    );
    return {
      initialized: false,
      registryFound: false,
      itemCount: Object.keys(ITEM_DATABASE).length,
      monsterCount: Object.keys(MONSTER_DATABASE).length,
    };
  }
}