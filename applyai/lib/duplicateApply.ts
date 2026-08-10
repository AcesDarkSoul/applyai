import type { Application } from '@/types';

export type DuplicateApplyKind = 'job' | 'company';

export interface DuplicateApplyHit {
  kind: DuplicateApplyKind;
  application: Application;
  message: string;
}

function normalizeCompany(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const ACTIVE: Application['status'][] = [
  'pending',
  'applied',
  'viewed',
  'interview',
  'offer',
  'accepted',
];

/**
 * Warn if the user already applied to the same job, or already has an
 * active application at the same company.
 */
export function findDuplicateApply(
  applications: Application[],
  job: { id: string; company: string }
): DuplicateApplyHit | null {
  const active = applications.filter((a) => ACTIVE.includes(a.status));

  const sameJob = active.find((a) => a.jobId === job.id);
  if (sameJob) {
    return {
      kind: 'job',
      application: sameJob,
      message: `You already applied to this role (${sameJob.jobTitle}) on ${formatDate(sameJob.appliedAt || sameJob.updatedAt)}. Apply again anyway?`,
    };
  }

  const companyKey = normalizeCompany(job.company);
  if (!companyKey) return null;

  const sameCompany = active.find((a) => normalizeCompany(a.company) === companyKey);
  if (sameCompany) {
    return {
      kind: 'company',
      application: sameCompany,
      message: `You already applied to ${sameCompany.company} for “${sameCompany.jobTitle}”. Apply to another role at the same company?`,
    };
  }

  return null;
}

function formatDate(iso?: string): string {
  if (!iso) return 'earlier';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'earlier';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
