import { Linking, Platform, Alert } from 'react-native';
import type { Job, UserProfile } from '@/types';
import { PlatformConfig, type PlatformKey } from '@/constants/theme';
import { hasLocalResume, shareLocalResume } from '@/lib/local/resumeStorage';

export type JobPlatform = PlatformKey;

/** Minimal job shape for LinkedIn share (API jobs or full Job). */
export type ShareableJob = {
  title: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  remote?: boolean;
};

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

export function buildApplyUrl(job: Job, _platform: JobPlatform): string {
  return job.url;
}

async function sendResumeFromLocal(): Promise<boolean> {
  const shared = await shareLocalResume();
  if (!shared) {
    Alert.alert('No Resume', 'Save your resume in the app first (Profile → Upload Resume).');
  }
  return shared;
}

export async function openSmartApply(pkg: ApplyPackage): Promise<boolean> {
  const config = getPlatformConfig(pkg.platform);
  const url = buildApplyUrl(pkg.job, pkg.platform);
  const localResume = await hasLocalResume();

  const message = localResume
    ? `Job: ${pkg.job.title} at ${pkg.job.company}\n\nYour resume is saved on this device. Tap "Send Resume" to attach it, then "Open Job" to apply on ${config.name}.`
    : `Job: ${pkg.job.title} at ${pkg.job.company}\n\nTip: Upload your resume in Profile first — then you can send it directly when applying.`;

  return new Promise((resolve) => {
    Alert.alert(`Apply on ${config.name}`, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      ...(localResume
        ? [
            {
              text: Platform.OS === 'web' ? 'Download Resume' : 'Send Resume',
              onPress: async () => {
                await sendResumeFromLocal();
                resolve(true);
              },
            },
          ]
        : []),
      {
        text: 'Open Job',
        onPress: async () => {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
          } else {
            Alert.alert('Error', 'Could not open the job link');
          }
          resolve(true);
        },
      },
    ]);
  });
}

export function buildLinkedInShareUrl(job: ShareableJob, _profile?: Partial<UserProfile>): string {
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

export function buildLinkedInPostText(job: ShareableJob, profile?: Partial<UserProfile>): string {
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

export async function shareOnLinkedIn(job: ShareableJob, profile?: Partial<UserProfile>): Promise<void> {
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
