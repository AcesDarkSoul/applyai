import { Linking, Platform, Alert } from 'react-native';
import type { Job, UserProfile } from '@/types';
import { PlatformConfig, type PlatformKey } from '@/constants/theme';
import { hasLocalResume, shareLocalResume } from '@/lib/local/resumeStorage';

export type JobPlatform = PlatformKey;

/**
 * Clean & normalize job URLs to prevent 404 errors (HTML entity decoding & canonical link extraction)
 */
export function cleanJobUrl(rawUrl: string, title?: string, company?: string, platform?: JobPlatform): string {
  if (!rawUrl) {
    return generateFallbackSearchUrl(title || 'Developer', company || '', platform || 'linkedin');
  }

  let clean = rawUrl.replace(/&amp;/g, '&').trim();

  // 1. LinkedIn Canonical URL cleaner: https://www.linkedin.com/jobs/view/<job_id>/
  const linkedinMatch = clean.match(/linkedin\.com\/jobs\/view\/([^/?#]+)/i);
  if (linkedinMatch) {
    return `https://www.linkedin.com/jobs/view/${linkedinMatch[1]}/`;
  }

  // 2. Indeed Canonical URL cleaner: https://www.indeed.com/viewjob?jk=<id>
  const indeedMatch = clean.match(/indeed\.com\/viewjob\?jk=([^&]+)/i);
  if (indeedMatch) {
    return `https://www.indeed.com/viewjob?jk=${indeedMatch[1]}`;
  }

  // 3. Ensure valid protocol
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  return clean;
}

function generateFallbackSearchUrl(title: string, company: string, platform: JobPlatform): string {
  const query = encodeURIComponent(`${title} ${company}`.trim());
  if (platform === 'linkedin') {
    return `https://www.linkedin.com/jobs/search/?keywords=${query}&location=India`;
  }
  if (platform === 'indeed') {
    return `https://www.indeed.com/jobs?q=${query}&l=India`;
  }
  if (platform === 'naukri') {
    return `https://www.naukri.com/jobs-in-india?k=${query}`;
  }
  return `https://www.google.com/search?q=${query}+job+apply`;
}

export function detectPlatform(url: string, source?: string): JobPlatform {
  const lower = (url + ' ' + (source || '')).toLowerCase();
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('indeed')) return 'indeed';
  if (lower.includes('naukri')) return 'naukri';
  return 'other';
}

export function getPlatformConfig(platform: JobPlatform) {
  return PlatformConfig[platform];
}

export interface ApplyPackage {
  job: Job;
  platform: JobPlatform;
  profile: Partial<UserProfile>;
}

export function buildApplyUrl(job: Job, platform: JobPlatform): string {
  if (job.url) {
    const cleaned = cleanJobUrl(job.url, job.title, job.company, platform);
    if (cleaned) return cleaned;
  }
  return generateFallbackSearchUrl(job.title, job.company, platform);
}

export async function openJobUrlDirectly(url: string, title?: string, company?: string): Promise<boolean> {
  const finalUrl = cleanJobUrl(url, title, company);
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }
      return true;
    }
    const canOpen = await Linking.canOpenURL(finalUrl);
    if (canOpen) {
      await WebBrowser.openBrowserAsync(finalUrl);
      return true;
    } else {
      await Linking.openURL(finalUrl);
      return true;
    }
  } catch {
    try {
      await Linking.openURL(finalUrl);
      return true;
    } catch {
      if (typeof window !== 'undefined') {
        window.open(finalUrl, '_blank');
        return true;
      }
      return false;
    }
  }
}

import * as WebBrowser from 'expo-web-browser';

export async function openSmartApply(pkg: ApplyPackage): Promise<boolean> {
  const url = buildApplyUrl(pkg.job, pkg.platform);
  return openJobUrlDirectly(url, pkg.job.title, pkg.job.company);
}

export function buildLinkedInShareUrl(job: Job, _profile?: Partial<UserProfile>): string {
  const cleanUrl = cleanJobUrl(job.url, job.title, job.company, 'linkedin');
  const text = encodeURIComponent(
    `🚀 Excited to explore the ${job.title} role at ${job.company}!\n\n` +
      `📍 ${job.location}${job.remote ? ' (Remote)' : ''}\n` +
      (job.salary ? `💰 ${job.salary}\n` : '') +
      `\n#OpenToWork #JobSearch #${job.company.replace(/\s/g, '')} #ApplyAI`
  );
  const urlParam = encodeURIComponent(cleanUrl);

  if (Platform.OS === 'web') {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${urlParam}`;
  }
  return `https://www.linkedin.com/feed/?shareActive=true&text=${text}%20${urlParam}`;
}

export function buildLinkedInPostText(job: Job, profile?: Partial<UserProfile>): string {
  const skills = profile?.skills?.slice(0, 3).join(', ') || '';
  return (
    `🎯 I'm actively exploring new opportunities!\n\n` +
    `Currently looking at: ${job.title} at ${job.company}\n` +
    `📍 ${job.location}${job.remote ? ' · Remote friendly' : ''}\n` +
    (skills ? `💡 Skills: ${skills}\n` : '') +
    `\nOpen to connect with recruiters and hiring managers.\n` +
    `#OpenToWork #JobSearch #Hiring #CareerGrowth`
  );
}

export async function shareOnLinkedIn(job: Job, profile?: Partial<UserProfile>): Promise<void> {
  const shareUrl = buildLinkedInShareUrl(job, profile);
  const postText = buildLinkedInPostText(job, profile);

  if (Platform.OS === 'web') {
    window.open(shareUrl, '_blank', 'width=600,height=500');
    return;
  }

  Alert.alert(
    'Share on LinkedIn',
    postText.substring(0, 200) + '...',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open LinkedIn', onPress: () => Linking.openURL(shareUrl) },
    ]
  );
}

export async function shareJobUpdate(message: string, jobUrl?: string): Promise<void> {
  const cleanUrl = jobUrl ? cleanJobUrl(jobUrl) : '';
  const linkedInUrl = cleanUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cleanUrl)}`
    : `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(message)}`;

  if (Platform.OS === 'web') {
    window.open(linkedInUrl, '_blank', 'width=600,height=500');
  } else {
    await Linking.openURL(linkedInUrl);
  }
}

export const SUPPORTED_PLATFORMS: JobPlatform[] = ['linkedin', 'indeed', 'naukri'];
