import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAuthStore } from '@/stores/authStore';
import { generateSocialPostAPI, type SocialPlatform, type SocialPostType } from '@/lib/firebase/functions';
import { copyPostToClipboard, openLinkedInWithPost, openRedditSubmit } from '@/lib/services/socialShare';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

const AI_POST_TYPES: { id: SocialPostType; label: string; emoji: string; platform: SocialPlatform }[] = [
  { id: 'opentowork', label: '#OpenToWork', emoji: '🎯', platform: 'linkedin' },
  { id: 'career_update', label: 'Career Update', emoji: '✨', platform: 'linkedin' },
  { id: 'reddit_forhire', label: 'Reddit [For Hire]', emoji: '🤖', platform: 'reddit' },
  { id: 'job_share', label: 'Job Highlight', emoji: '💼', platform: 'linkedin' },
];

export default function LinkedInShareScreen() {
  const { profile } = useAuthStore();
  const [generatedPost, setGeneratedPost] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [suggestedSub, setSuggestedSub] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [lastPlatform, setLastPlatform] = useState<SocialPlatform>('linkedin');

  const handleGenerate = async (postType: SocialPostType, platform: SocialPlatform) => {
    setLoading(postType);
    try {
      const result = await generateSocialPostAPI({
        platform,
        postType,
        customPrompt: customPrompt.trim() || undefined,
      });
      setGeneratedPost(result.content);
      setGeneratedTitle(result.title || '');
      setSuggestedSub(result.suggestedSubreddit || '');
      setLastPlatform(platform);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to generate';
      Alert.alert(
        'AI Unavailable',
        msg.includes('not-found') || msg.includes('internal')
          ? 'Deploy Cloud Functions first:\nfirebase deploy --only functions'
          : msg
      );
    } finally {
      setLoading(null);
    }
  };

  const handleShare = async () => {
    if (!generatedPost.trim()) {
      Alert.alert('No Post', 'Generate a post with AI first');
      return;
    }
    if (lastPlatform === 'reddit') {
      openRedditSubmit({
        title: generatedTitle,
        content: generatedPost,
        suggestedSubreddit: suggestedSub,
        hashtags: [],
        platform: 'reddit',
      });
    } else {
      openLinkedInWithPost(generatedPost);
    }
  };

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient colors={[Colors.linkedin, '#004182']} style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>AI Social Posts</Text>
          <Text style={styles.heroSubtitle}>
            GPT-4o-mini writes LinkedIn & Reddit posts from your profile — you post manually (ToS safe)
          </Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={100}>
        <Text style={styles.sectionTitle}>Generate with AI</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {AI_POST_TYPES.map((t) => (
            <Pressable
              key={t.id}
              style={styles.chip}
              onPress={() => handleGenerate(t.id, t.platform)}
              disabled={!!loading}
            >
              <Text style={styles.chipEmoji}>{t.emoji}</Text>
              <Text style={styles.chipLabel}>{loading === t.id ? '...' : t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </FadeInView>

      <FadeInView direction="up" delay={150}>
        <Card>
          <Text style={styles.inputLabel}>Extra instructions (optional)</Text>
          <TextInput
            style={styles.textAreaSmall}
            placeholder="e.g. Focus on React Native roles, mention 3 years experience..."
            placeholderTextColor={Colors.textMuted}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
          />
        </Card>
      </FadeInView>

      {generatedPost ? (
        <FadeInView direction="up" delay={200}>
          <Text style={styles.sectionTitle}>
            {lastPlatform === 'reddit' ? 'Reddit Post' : 'LinkedIn Post'}
            {suggestedSub ? ` · ${suggestedSub}` : ''}
          </Text>
          <Card>
            {generatedTitle ? (
              <Text style={styles.postTitle}>{generatedTitle}</Text>
            ) : null}
            <Text style={styles.postBody}>{generatedPost}</Text>
            <View style={styles.actions}>
              <Button
                title={lastPlatform === 'reddit' ? 'Open Reddit' : 'Open LinkedIn'}
                onPress={handleShare}
                style={{ flex: 1 }}
              />
              <Button
                title="Copy"
                variant="outline"
                onPress={() => copyPostToClipboard(generatedPost)}
                style={{ flex: 0.45 }}
              />
            </View>
          </Card>
        </FadeInView>
      ) : (
        <FadeInView direction="up" delay={200}>
          <Card style={styles.hintCard}>
            <Text style={styles.hintText}>
              Tap a button above to generate a personalized post for {profile?.name || 'you'}.
              Skills used: {profile?.skills?.slice(0, 4).join(', ') || 'add resume first'}.
            </Text>
          </Card>
        </FadeInView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '900' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.md, marginTop: Spacing.xs, textAlign: 'center', lineHeight: 22 },
  sectionTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '800', marginBottom: Spacing.md, marginTop: Spacing.sm },
  chips: { marginBottom: Spacing.md },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    alignItems: 'center',
    minWidth: 110,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  chipLabel: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center' },
  inputLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs, fontWeight: '600' },
  textAreaSmall: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.sm,
    minHeight: 72,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800', marginBottom: Spacing.sm },
  postBody: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  hintCard: { backgroundColor: Colors.secondary + '20' },
  hintText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
});
