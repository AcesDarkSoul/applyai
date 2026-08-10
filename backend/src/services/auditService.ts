import { randomUUID } from 'crypto';
import { logger } from '../config/logger';
import type { AuditAction, AuditLogEntry, SmartApplyPlatformPrefs } from '../domain/audit';
import { fileStore } from '../repositories/file/fileStore';

export class AuditService {
  async append(
    userId: string,
    action: AuditAction,
    summary: string,
    extra?: Partial<Omit<AuditLogEntry, 'id' | 'userId' | 'action' | 'summary' | 'createdAt'>>,
  ): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: randomUUID(),
      userId,
      action,
      summary,
      createdAt: new Date().toISOString(),
      ...extra,
    };
    await fileStore.set('activityLogs', entry.id, entry);
    logger.info('audit', { userId, action, summary });
    return entry;
  }

  async listByUser(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    const rows = await fileStore.queryByField<AuditLogEntry>('activityLogs', 'userId', userId);
    return rows
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, Math.min(200, Math.max(1, limit)));
  }
}

export const auditService = new AuditService();

/** Resolve job source to a Smart Apply platform key. */
export function platformKeyFromSource(source: string): keyof SmartApplyPlatformPrefs {
  const s = (source || '').toLowerCase();
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('indeed')) return 'indeed';
  if (s.includes('naukri')) return 'naukri';
  if (s.includes('google')) return 'googlejobs';
  return 'other';
}

export function isPlatformEnabled(
  prefs: SmartApplyPlatformPrefs | undefined,
  source: string,
): boolean {
  const key = platformKeyFromSource(source);
  const defaults: Required<SmartApplyPlatformPrefs> = {
    linkedin: true,
    indeed: true,
    naukri: true,
    googlejobs: true,
    other: true,
  };
  const merged = { ...defaults, ...(prefs || {}) };
  return merged[key] !== false;
}
