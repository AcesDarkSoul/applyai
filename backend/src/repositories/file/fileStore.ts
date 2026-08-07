import fs from 'fs';
import path from 'path';
import { logger } from '../../config/logger';

const DATA_DIR = path.resolve(process.cwd(), 'data', 'store');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function collectionPath(name: string): string {
  const dir = path.join(DATA_DIR, name);
  ensureDir(dir);
  return dir;
}

function docPath(collection: string, id: string): string {
  return path.join(collectionPath(collection), `${id}.json`);
}

/** Durable local mirror of Firestore docs when Admin SDK credentials are absent. */
export const fileStore = {
  async get<T>(collection: string, id: string): Promise<T | null> {
    const file = docPath(collection, id);
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
    } catch (err) {
      logger.warn('fileStore read failed', { collection, id, err });
      return null;
    }
  },

  async set<T>(collection: string, id: string, data: T): Promise<T> {
    ensureDir(collectionPath(collection));
    const file = docPath(collection, id);
    fs.writeFileSync(file, JSON.stringify({ ...data, id }, null, 2), 'utf8');
    return { ...data, id } as T;
  },

  async list<T>(collection: string): Promise<T[]> {
    const dir = collectionPath(collection);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    const out: T[] = [];
    for (const f of files) {
      try {
        out.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as T);
      } catch {
        // skip corrupt
      }
    }
    return out;
  },

  async queryByField<T>(
    collection: string,
    field: string,
    value: unknown,
  ): Promise<T[]> {
    const all = await this.list<T>(collection);
    return all.filter((row) => (row as Record<string, unknown>)[field] === value);
  },
};
