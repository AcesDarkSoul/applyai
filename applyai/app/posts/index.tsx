import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/layout/Screen';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { AppDrawer } from '@/components/layout/AppDrawer';
import { postRepository, type HiringPost } from '@/lib/api/repositories';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function HiringPostsScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<HiringPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'all' | 'linkedin' | 'googlejobs'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await postRepository.list(q);
      setPosts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = posts.filter((p) =>
    source === 'all' ? true : p.source?.toLowerCase().includes(source === 'googlejobs' ? 'google' : 'linkedin')
  );

  return (
    <View style={styles.root}>
      <AppDrawer />
      <AppTopBar title="Hiring Posts" subtitle="LinkedIn & Google Jobs posts" />
      <Screen safe edges={['left', 'right', 'bottom']}>
        <View style={styles.hero}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LinkedIn & Google Jobs posts.</Text>
          </View>
          <Text style={styles.title}>Hiring Posts</Text>
          <Text style={styles.body}>
            Full LinkedIn & Google Jobs posts with complete text, contacts, and structured sections.
          </Text>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search posts by title, company"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              onSubmitEditing={() => void load()}
            />
          </View>
          <Pressable style={styles.searchBtn} onPress={() => void load()}>
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        <View style={styles.chips}>
          {(['all', 'linkedin', 'googlejobs'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSource(s)}
              style={[styles.chip, source === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, source === s && styles.chipTextActive]}>
                {s === 'all' ? `All (${posts.length})` : s === 'linkedin' ? 'LinkedIn' : 'Google Jobs'}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No posts found.</Text>
        ) : (
          filtered.map((post) => (
            <Pressable
              key={post.id}
              style={styles.card}
              onPress={() => router.push(`/posts/${post.id}` as never)}
            >
              <View style={styles.tags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{post.source}</Text>
                </View>
                {post.matchScore != null && (
                  <View style={[styles.tag, styles.tagMatch]}>
                    <Text style={styles.tagMatchText}>{Math.round(post.matchScore)}% Match</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{post.title}</Text>
              <Text style={styles.cardMeta}>
                {post.company}
                {post.location ? ` · ${post.location}` : ''}
              </Text>
              {post.snippet ? (
                <Text style={styles.snippet} numberOfLines={3}>
                  {post.snippet}
                </Text>
              ) : null}
            </Pressable>
          ))
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
    gap: 8,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  title: { color: Colors.text, fontWeight: '800', fontSize: FontSize.xxl },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 4,
  },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.sm },
  searchBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  searchBtnText: { color: Colors.white, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontWeight: '700', fontSize: FontSize.xs },
  chipTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  tags: { flexDirection: 'row', gap: 8 },
  tag: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tagMatch: { backgroundColor: Colors.primaryTint },
  tagText: { color: Colors.info, fontSize: 10, fontWeight: '700' },
  tagMatchText: { color: Colors.primaryLight, fontSize: 10, fontWeight: '700' },
  cardTitle: { color: Colors.text, fontWeight: '800', fontSize: FontSize.md },
  cardMeta: { color: Colors.textMuted, fontSize: FontSize.xs },
  snippet: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 },
  error: { color: Colors.danger, marginTop: 16 },
  empty: { color: Colors.textMuted, marginTop: 16 },
});
