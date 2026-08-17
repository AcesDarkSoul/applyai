import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { postRepository, type HiringPost } from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<HiringPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        setPost(await postRepository.get(id));
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <View style={styles.root}>
      <AppTopBar title="Hiring Post" subtitle="Full post detail" showBack />
      <Screen safe edges={['left', 'right', 'bottom']}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : !post ? (
          <Text style={styles.error}>Post not found.</Text>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.source}>{post.source}</Text>
              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.meta}>
                {post.company}
                {post.location ? ` · ${post.location}` : ''}
              </Text>
              {post.matchScore != null && (
                <Text style={styles.match}>{Math.round(post.matchScore)}% match</Text>
              )}
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Post content</Text>
              <Text style={styles.body}>{post.body || post.snippet || 'No content.'}</Text>
            </View>
            {(post.contacts?.email || post.contacts?.phone) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Contacts</Text>
                {post.contacts.email ? <Text style={styles.body}>{post.contacts.email}</Text> : null}
                {post.contacts.phone ? <Text style={styles.body}>{post.contacts.phone}</Text> : null}
              </View>
            )}
            <View style={styles.actions}>
              {post.applyUrl ? (
                <Pressable style={styles.primaryBtn} onPress={() => void Linking.openURL(post.applyUrl!)}>
                  <Text style={styles.primaryBtnText}>Open post</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.outlineBtn} onPress={() => router.push('/(tabs)/jobs')}>
                <Text style={styles.outlineBtnText}>Find formal board roles</Text>
              </Pressable>
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 6,
  },
  source: { color: Colors.primaryLight, fontWeight: '700', fontSize: FontSize.xs },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xl },
  meta: { color: Colors.textMuted, fontSize: FontSize.sm },
  match: { color: Colors.success, fontWeight: '800' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  cardTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.lg },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  actions: { gap: 8 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '800' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  outlineBtnText: { color: Colors.text, fontWeight: '700' },
  error: { color: Colors.danger },
});
