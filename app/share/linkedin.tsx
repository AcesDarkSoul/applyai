import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, Pressable, Linking, Platform } from 'react-native';
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

function generateFallbackSocialPost(
  profile: Record<string, unknown> | null,
  postType: SocialPostType,
  customPrompt?: string
) {
  const name = (profile?.name as string) || 'Software Professional';
  const skillsList = Array.isArray(profile?.skills) ? (profile.skills as string[]) : [];
  const skills = skillsList.slice(0, 4).join(', ') || 'Software Development, React, Problem Solving';
  const exp = (profile?.experience as number) || 0;
  const loc = (profile?.preferredLocation as string) || 'Remote';

  let title = '';
  let content = '';
  let suggestedSubreddit = '';

  if (postType === 'opentowork') {
    content = `🎯 I'm actively exploring new opportunities!\n\nHi everyone! I am ${name}, a developer with ${exp > 0 ? `${exp}+ years of experience` : 'expertise'} in ${skills}.\n\nI'm looking for ${loc} roles where I can build impactful products and collaborate with modern tech teams.\n\n${customPrompt ? `Note: ${customPrompt}\n\n` : ''}Open to connect with recruiters and hiring managers!\n\n#OpenToWork #Hiring #SoftwareEngineer #JobSearch #React`;
  } else if (postType === 'career_update') {
    content = `✨ Excited for the next chapter in my professional journey!\n\nLately I've been expanding my expertise in ${skills} and building modern applications.\n\n${customPrompt ? `${customPrompt}\n\n` : ''}Grateful to my network for the ongoing support!\n\n#CareerGrowth #TechCommunity #SoftwareEngineering #ContinuousLearning`;
  } else if (postType === 'job_share') {
    content = `💼 Exploring exciting positions in tech!\n\nTargeting roles focused on ${skills}.\n\nIf your team is looking for passionate engineers in ${loc} roles, let's connect!\n\n#JobHighlight #Hiring #OpenToWork #CareerOpportunities`;
  } else {
    title = `[For Hire] ${name} - ${skills} Developer`;
    content = `Hi r/forhire! I am available for full-time or contract opportunities.\n\nKey Skills: ${skills}\nExperience: ${exp} years\nLocation: ${loc}\n\n${customPrompt ? `Details: ${customPrompt}\n\n` : ''}Feel free to Send a PM for my resume and portfolio!`;
    suggestedSubreddit = 'r/forhire';
  }

  return { title, content, suggestedSubreddit };
}

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
    setLastPlatform(platform);

    let fetched = false;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 2500)
      );

      const result = (await Promise.race([
        generateSocialPostAPI({
          platform,
          postType,
          customPrompt: customPrompt.trim() || undefined,
        }),
        timeoutPromise,
      ])) as { content: string; title?: string; suggestedSubreddit?: string };

      if (result && result.content) {
        setGeneratedPost(result.content);
        setGeneratedTitle(result.title || '');
        setSuggestedSub(result.suggestedSubreddit || '');
        fetched = true;
      }
    } catch {
      // Use smart fallback generator
    }

    if (!fetched) {
      const fallback = generateFallbackSocialPost(profile as Record<string, unknown> | null, postType, customPrompt.trim() || undefined);
      setGeneratedPost(fallback.content);
      setGeneratedTitle(fallback.title);
      setSuggestedSub(fallback.suggestedSubreddit);
    }

    setLoading(null);
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
                title="WhatsApp 💬"
                variant="secondary"
                onPress={() => {
                  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedPost)}`;
                  Linking.openURL(url);
                }}
                style={{ flex: 0.8 }}
              />
              <Button
                title="SMS 📱"
                variant="outline"
                onPress={() => {
                  const smsUrl = Platform.OS === 'ios'
                    ? `sms:&body=${encodeURIComponent(generatedPost)}`
                    : `sms:?body=${encodeURIComponent(generatedPost)}`;
                  Linking.openURL(smsUrl);
                }}
                style={{ flex: 0.6 }}
              />
              <Button
                title="Copy"
                variant="ghost"
                onPress={() => copyPostToClipboard(generatedPost)}
                style={{ flex: 0.5 }}
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
