import { Linking, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { GeneratedPost } from '@/lib/firebase/functions';

export async function copyPostToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
  Alert.alert('Copied!', 'Post copied to clipboard. Paste it on the platform.');
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
