import { Linking, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { GeneratedPost } from '@/lib/firebase/functions';
import type { Job } from '@/types';

export function buildShareMessage(job: Job): string {
  return (
    `🎯 Job Opportunity: ${job.title} at ${job.company}\n` +
    `📍 ${job.location}${job.remote ? ' (Remote)' : ''}\n` +
    (job.salary ? `💰 Salary: ${job.salary}\n` : '') +
    (job.matchScore ? `⚡ Match Score: ${job.matchScore.overall}%\n` : '') +
    `\nApply directly on ${job.source} here:\n${job.url}`
  );
}

export async function shareToWhatsApp(job: Job): Promise<void> {
  const message = buildShareMessage(job);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  try {
    if (Platform.OS === 'web') {
      window.open(whatsappUrl, '_blank');
      return;
    }
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`);
    }
  } catch {
    Alert.alert('Notice', 'Opening WhatsApp in browser...');
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  }
}

export async function shareToSMS(job: Job): Promise<void> {
  const message = buildShareMessage(job);
  const smsUrl = Platform.OS === 'ios'
    ? `sms:&body=${encodeURIComponent(message)}`
    : `sms:?body=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(smsUrl);
  } catch {
    await copyPostToClipboard(message);
    Alert.alert('Copied to Clipboard', 'Text messaging could not be opened directly. Message copied to clipboard!');
  }
}

export async function copyPostToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
  Alert.alert('Copied!', 'Content copied to clipboard.');
}

export function openLinkedInWithPost(content: string, jobUrl?: string): void {
  const url = jobUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`
    : `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`;

  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'width=600,height=500');
  } else {
    Linking.openURL(url);
  }
}

export function openRedditSubmit(post: GeneratedPost): void {
  const title = post.title || 'Open to work — seeking new opportunities';
  const body = post.content;
  const sub = (post.suggestedSubreddit || 'forhire').replace(/^r\//, '');
  const url = `https://www.reddit.com/r/${sub}/submit?title=${encodeURIComponent(title)}&text=${encodeURIComponent(body)}`;

  if (Platform.OS === 'web') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url);
  }
}

export async function shareGeneratedPost(post: GeneratedPost, jobUrl?: string): Promise<void> {
  if (post.platform === 'reddit') {
    await copyPostToClipboard(post.content);
    openRedditSubmit(post);
    return;
  }
  openLinkedInWithPost(post.content, jobUrl);
}
