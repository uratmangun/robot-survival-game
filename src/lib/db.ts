import fs from 'fs';
import path from 'path';
import Loki, { Collection } from 'lokijs';
// @types/lokijs fallback
// custom declaration in src/types/lokijs.d.ts

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbFile = path.join(dataDir, 'db.json');
const db = new Loki(dbFile, {
  autoload: false,
  autosave: true,
  autosaveInterval: 4000,
  persistenceMethod: 'fs',
});

let loaded = false;
function initializeDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.loadDatabase({}, (err: Error | null) => {
      if (err) {
        return reject(err);
      }
      loaded = true;
      resolve();
    });
  });
}

async function getDb(): Promise<Loki> {
  if (!loaded) await initializeDb();
  return db;
}

export async function getCollection<T = any>(name: string): Promise<Collection<T>> {
  const database = await getDb();
  let coll = database.getCollection<T>(name);
  if (!coll) {
    coll = database.addCollection<T>(name);
    await saveDatabase();
  }
  return coll;
}

export async function insert<T = any>(name: string, data: T): Promise<T> {
  const coll = await getCollection<T>(name);
  const result = coll.insert(data);
  await saveDatabase();
  return result;
}

export async function update<T = any>(
  name: string,
  query: Partial<T>,
  updateData: Partial<T>
): Promise<T[]> {
  const coll = await getCollection<T>(name);
  const docs = coll.find(query) as T[];
  const updated: T[] = [];
  docs.forEach((doc: T) => {
    const merged = { ...(doc as object), ...(updateData as object) } as T;
    Object.entries(updateData).forEach(([key, value]) => {
      (doc as any)[key] = value;
    });
    coll.update(doc);
    updated.push(merged);
  });
  await saveDatabase();
  return updated;
}

export async function remove<T = any>(name: string, query: Partial<T>): Promise<T[]> {
  const coll = await getCollection<T>(name);
  const docs = coll.find(query) as T[];
  docs.forEach((doc) => coll.remove(doc));
  await saveDatabase();
  return docs;
}

export async function listCollections(): Promise<string[]> {
  const database = await getDb();
  // extract names from LokiJS collections
  const names = (database.collections as any[]).map((c: any) => c.name);
  return names;
}

export function saveDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.saveDatabase((err: Error | null) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
