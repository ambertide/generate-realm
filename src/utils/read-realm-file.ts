import Realm, {ObjectSchema} from 'realm';
import {readFile} from 'node:fs/promises';

type Schemas = { [schemaName: string]: ObjectSchema };

type RealmObjects = { [objectSchemaName: string]: Record<string, unknown>[] };

interface SuccessfulStatus {
  success: true;
  createdObjectCount: number;
}

interface FailedStatus {
  success: false;
  error: string;
}

type Status = SuccessfulStatus | FailedStatus;

async function readJSONFile<T>(path: string): Promise<T> {
  const file = await readFile(path, {encoding: 'utf-8'});
  return JSON.parse(file);
}

function isPropTypeRealmType(objectNames: string[], propType: string) {
  return objectNames.includes((propType.replace('?', '')));
}

function isPropTypeRealmTypeArray(objectNames: string[], propType: string) {
  return isPropTypeRealmType(objectNames, propType.replace('[]', ''));
}

const unitResolver = (v: any) => v;
type Resolver = (v: any) => any;

/**
 * Generate the resolver for a single realm object property.
 * A resolver is a function of type v => any that maps the
 * value of a property in a schema object defined in JSON
 * to a format the Realm engine can understand.
 *
 * In general, objectId and "foreign keys" resolve to specific
 * resolvers while other types use the x => x unit function
 * as a resolver.
 * @param realm Realm being operated on.
 * @param objectNames Names of objects.
 * @param propType Type of the prop.
 * @returns the resolver function
 */
function resolveResolver(realm: Realm, objectNames: string[], propType: string): Resolver {
  let resolver = unitResolver;
  if (propType === 'objectId') {
    resolver = (hex: string) => new Realm.BSON.ObjectID(hex);
  } else if (isPropTypeRealmType(objectNames, propType)) {
    resolver = (hex: string) => realm.objectForPrimaryKey(propType, new Realm.BSON.ObjectID(hex));
  } else if (isPropTypeRealmTypeArray(objectNames, propType)) {
    resolver = (hexes: string[]) => hexes.map(hex => realm.objectForPrimaryKey(propType, new Realm.BSON.ObjectID(hex)));
  }

  return resolver;
}

/**
 * Generate realm objects.
 * @param name Name of the schema.
 * @param realm Realm controller object.
 * @param existingObjectNames Names of the already existing objects.
 * @param schema Schema for the current object.
 * @param objects List of objects to be generated in pure javascript.
 * @returns List of generated objects.
 */
// eslint-disable-next-line max-params
function generateRealmObjects(
  name: string,
  realm: Realm,
  existingObjectNames: string[],
  schema: ObjectSchema,
  objects: Record<string, unknown>[],
): Realm.Object[] {
  // First create functions that resolve each prop to its real value,
  // For normal types this just resolves to itself, but for foreign keys
  // It resolves to the object the foreign key identifies.
  const resolvers = Object.fromEntries(Object.entries(schema.properties).map(([prop, propType]) => [
    prop,
    resolveResolver(realm, existingObjectNames, propType as string),
  ]));
  // Now use the resolves to generate the proper objects.
  const resolvedObjects = objects.map(
    o => Object.fromEntries(
      Object.entries(o).map(
        // Resolve each object's each prop using its apporiprate resolver.
        ([prop, value]) => [prop, resolvers[prop](value)],
      ),
    ));
  // Now write the resolved objects to the Realm.
  return resolvedObjects.map(o => realm.write(() => realm.create(name, o)));
}

interface GenerateRealm {
  realm: Realm;
  realmObjects: Realm.Object[]
}

/**
 * Generate a realm file and populate it.
 * @param schemas Object schemas for the given file.
 * @param objects Objects for the given file.
 * @param outputPath Defines the output path for the realm file.
 * when not provided, creates an in memory file.
 * @returns The generated realm objects and the realm itself.
 */
export async function generateRealm(schemas: Schemas, objects: RealmObjects, outputPath?: string): Promise<GenerateRealm> {
  const realm = await Realm.open({
    schema: Object.values(schemas),
    ...(outputPath ? {path: outputPath} : {inMemory: true}),
  });
  return {
    realm,
    realmObjects: Object.entries(objects).flatMap(
      ([schemaName, objectsOfSchema]) =>
        generateRealmObjects(schemaName, realm, Object.keys(objects), schemas[schemaName], objectsOfSchema),
    ),
  };
}

/**
 * Process JSON schemas and generate a Realm file.
 * @param schemaPath Path to the JSON file containing the schemas.
 * @param objectsPath Path to the JSON file containing the objects.
 * @param outputPath The output filename for the Realm file, when not
 * provided creates an in memory realm file.
 * @returns Status of conversion.
 */
export async function generateRealmFromJSON(
  schemaPath: string,
  objectsPath?: string,
  outputPath?: string,
): Promise<Status> {
  try {
    const schemas = await readJSONFile<Promise<Schemas>>(schemaPath);
    const objects = objectsPath ? await readJSONFile<Promise<RealmObjects>>(objectsPath) : {};
    const {realm, realmObjects} = await generateRealm(schemas, objects, outputPath);
    realm.close();
    return {
      success: true,
      createdObjectCount: realmObjects.length,
    };
  } catch (error) {
    return {
      success: false,
      error: (error instanceof Error ? error.message : 'Unknown error occured at processing.'),
    };
  }
}
