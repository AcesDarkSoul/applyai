import fs from 'node:fs';
import path from 'node:path';
import type { Job } from '../../domain/job';
import { logger } from '../../config/logger';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'jobs-catalog.json');

type CatalogShape = {
  updatedAt: string | null;
  source: string;
  jobs: Job[];
};

function emptyCatalog(): CatalogShape {
  return { updatedAt: null, source: 'none', jobs: [] };
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFile(): CatalogShape {
  try {
    if (!fs.existsSync(CATALOG_FILE)) return emptyCatalog();
    const raw = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8')) as CatalogShape;
    return {
      updatedAt: raw.updatedAt ?? null,
      source: raw.source || 'file',
      jobs: Array.isArray(raw.jobs) ? raw.jobs : [],
    };
  } catch (err) {
    logger.warn('Failed to read jobs catalog; starting empty', {
      err: err instanceof Error ? err.message : err,
    });
    return emptyCatalog();
  }
}

let cache: CatalogShape = readFile();

export const jobCatalog = {
  list(): Job[] {
    return [...cache.jobs];
  },

  meta(): { updatedAt: string | null; source: string; count: number } {
    return {
      updatedAt: cache.updatedAt,
      source: cache.source,
      count: cache.jobs.length,
    };
  },

  getById(id: string): Job | undefined {
    return cache.jobs.find((j) => j.id === id);
  },

  /** Upsert by id; dedupe title+company keeps newest. */
  upsertMany(incoming: Job[], sourceLabel = 'ingest'): { added: number; total: number } {
    const byId = new Map<string, Job>();
    for (const job of cache.jobs) byId.set(job.id, job);

    let added = 0;
    for (const job of incoming) {
      if (!job.id || !job.title || !job.company) continue;
      if (!byId.has(job.id)) added += 1;
      byId.set(job.id, job);
    }

    // Secondary dedupe: title|company (case-insensitive)
    const seenKey = new Set<string>();
    const deduped: Job[] = [];
    for (const job of byId.values()) {
      const key = `${job.title}|${job.company}`.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seenKey.has(key)) continue;
      seenKey.add(key);
      deduped.push(job);
    }

    cache = {
      updatedAt: new Date().toISOString(),
      source: sourceLabel,
      jobs: deduped,
    };
    this.persist();
    return { added, total: cache.jobs.length };
  },

  replaceAll(jobs: Job[], sourceLabel = 'refresh'): { total: number } {
    cache = {
      updatedAt: new Date().toISOString(),
      source: sourceLabel,
      jobs,
    };
    this.persist();
    return { total: cache.jobs.length };
  },

  clear(): void {
    cache = emptyCatalog();
    this.persist();
  },

  persist(): void {
    try {
      ensureDir();
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(cache, null, 2), 'utf8');
    } catch (err) {
      logger.warn('Failed to persist jobs catalog', {
        err: err instanceof Error ? err.message : err,
      });
    }
  },
};
