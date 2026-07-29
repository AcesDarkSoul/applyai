import { Linking, Platform, Alert } from 'react-native';
import type { Job, UserProfile } from '@/types';
import { PlatformConfig, type PlatformKey } from '@/constants/theme';
import { hasLocalResume, shareLocalResume } from '@/lib/local/resumeStorage';

export type JobPlatform = PlatformKey;

export function detectPlatform(url: string, source?: string): JobPlatform {
  const lower = (url + ' ' + (source || '')).toLowerCase();
  if (lower.includes('linkedin.com')) return 'linkedin';
  if (lower.includes('indeed.com') || lower.includes('indeed.co')) return 'indeed';
  if (lower.includes('naukri.com')) return 'naukri';
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
  // Always return exact direct job opening listing URL directly if provided
  if (job.url && job.url.startsWith('http')) {
    return job.url;
  }

  // Direct platform fallback query only if url is missing
  const cleanTitle = job.title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const query = encodeURIComponent(cleanTitle);

  if (platform === 'linkedin') {
    return `https://www.linkedin.com/jobs/search/?keywords=${query}&location=India`;
  }
  if (platform === 'indeed') {
    return `https://www.indeed.com/jobs?q=${query}&l=India`;
  }
  if (platform === 'naukri') {
    return `https://www.naukri.com/jobs-in-india?k=${query}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} ${job.company} job apply`)}`;
}

async function sendResumeFromLocal(): Promise<boolean> {
  const shared = await shareLocalResume();
  if (!shared) {
    Alert.alert('No Resume', 'Save your resume in the app first (Profile → Upload Resume).');
  }
  return shared;
}

import * as WebBrowser from 'expo-web-browser';

export type ApplicationConfirmStatus = 'applied' | 'pending' | null;

export async function openJobUrlDirectly(url: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return true;
    }
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await WebBrowser.openBrowserAsync(url);
      return true;
    } else {
      await Linking.openURL(url);
      return true;
    }
  } catch {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
        return true;
      }
      return false;
    }
  }
}

export async function openSmartApply(pkg: ApplyPackage): Promise<boolean> {
  const url = buildApplyUrl(pkg.job, pkg.platform);
  return openJobUrlDirectly(url);
}

export function buildLinkedInShareUrl(job: Job, _profile?: Partial<UserProfile>): string {
  const text = encodeURIComponent(
    `🚀 Excited to explore the ${job.title} role at ${job.company}!\n\n` +
      `📍 ${job.location}${job.remote ? ' (Remote)' : ''}\n` +
      (job.salary ? `💰 ${job.salary}\n` : '') +
      `\n#OpenToWork #JobSearch #${job.company.replace(/\s/g, '')} #ApplyAI`
  );
  const url = encodeURIComponent(job.url);

  if (Platform.OS === 'web') {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  }
  return `https://www.linkedin.com/feed/?shareActive=true&text=${text}%20${url}`;
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
  const linkedInUrl = jobUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`
    : `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(message)}`;

  if (Platform.OS === 'web') {
    window.open(linkedInUrl, '_blank', 'width=600,height=500');
  } else {
    await Linking.openURL(linkedInUrl);
  }
}

export const SUPPORTED_PLATFORMS: JobPlatform[] = ['linkedin', 'indeed', 'naukri'];
