import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, SectionHeader } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { FadeInView } from '@/components/AnimatedView';
import { useAutomationStore } from '@/stores/automationStore';
import { testWebhookUrl } from '@/lib/services/automation';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function AutomationHubScreen() {
  const router = useRouter();
  const {
    sheetsWebhookUrl,
    whatsappWebhookUrl,
    telegramWebhookUrl,
    autoAlertsEnabled,
    minMatchScoreThreshold,
    targetRoleKeywords,
    loadSettings,
    saveSettings,
  } = useAutomationStore();

  const [sheetsUrl, setSheetsUrl] = useState(sheetsWebhookUrl);
  const [whatsappUrl, setWhatsappUrl] = useState(whatsappWebhookUrl);
  const [telegramUrl, setTelegramUrl] = useState(telegramWebhookUrl);
  const [autoAlerts, setAutoAlerts] = useState(autoAlertsEnabled);
  const [minScore, setMinScore] = useState(String(minMatchScoreThreshold));
  const [keywords, setKeywords] = useState(targetRoleKeywords.join(', '));
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setSheetsUrl(sheetsWebhookUrl);
    setWhatsappUrl(whatsappWebhookUrl);
    setTelegramUrl(telegramWebhookUrl);
    setAutoAlerts(autoAlertsEnabled);
    setMinScore(String(minMatchScoreThreshold));
    setKeywords(targetRoleKeywords.join(', '));
  }, [
    sheetsWebhookUrl,
    whatsappWebhookUrl,
    telegramWebhookUrl,
    autoAlertsEnabled,
    minMatchScoreThreshold,
    targetRoleKeywords,
  ]);

  const handleTestWebhook = async (url: string, keyName: string) => {
    if (!url.trim()) {
      Alert.alert('Missing URL', `Please enter a valid ${keyName} Webhook URL first.`);
      return;
    }
    setTestingKey(keyName);
    try {
      const res = await testWebhookUrl(url.trim());
      Alert.alert(res.success ? 'Success 🚀' : 'Notice', res.message);
    } catch {
      Alert.alert('Error', `Could not reach ${keyName} Webhook URL.`);
    } finally {
      setTestingKey(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const parsedKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    const numScore = Math.max(10, Math.min(100, parseInt(minScore, 10) || 80));

    try {
      await saveSettings({
        sheetsWebhookUrl: sheetsUrl.trim(),
        whatsappWebhookUrl: whatsappUrl.trim(),
        telegramWebhookUrl: telegramUrl.trim(),
        autoAlertsEnabled: autoAlerts,
        minMatchScoreThreshold: numScore,
        targetRoleKeywords: parsedKeywords.length > 0 ? parsedKeywords : ['Android', 'Kotlin', 'Remote'],
      });
      Alert.alert('Settings Saved ✅', 'Webhook configuration updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save webhook settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen safe={false} edges={['left', 'right']}>
      <FadeInView direction="down">
        <LinearGradient colors={Colors.gradientHero} style={styles.hero}>
          <Text style={styles.heroEmoji}>⚡</Text>
          <Text style={styles.heroTitle}>Webhooks Configuration</Text>
          <Text style={styles.heroSubtitle}>
            Configure your personal Google Sheets, WhatsApp, and Telegram Webhooks for instant direct updates on every application!
          </Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView direction="up" delay={80}>
        <SectionHeader title="Live Integration Webhooks" />
        <Card style={styles.card}>
          {/* 1. Google Sheets Webhook */}
          <Text style={styles.inputLabel}>📊 Google Sheets Apps Script Webhook URL:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="https://script.google.com/macros/s/.../exec"
              placeholderTextColor={Colors.textMuted}
              value={sheetsUrl}
              onChangeText={setSheetsUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Button
              title={testingKey === 'Google Sheets' ? 'Testing...' : 'Test'}
              variant="outline"
              size="sm"
              loading={testingKey === 'Google Sheets'}
              onPress={() => handleTestWebhook(sheetsUrl, 'Google Sheets')}
            />
          </View>

          {/* 2. WhatsApp Webhook */}
          <Text style={styles.inputLabel}>💬 WhatsApp Alert Webhook URL:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="https://api.whatsapp-provider.com/webhook/..."
              placeholderTextColor={Colors.textMuted}
              value={whatsappUrl}
              onChangeText={setWhatsappUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Button
              title={testingKey === 'WhatsApp' ? 'Testing...' : 'Test'}
              variant="outline"
              size="sm"
              loading={testingKey === 'WhatsApp'}
              onPress={() => handleTestWebhook(whatsappUrl, 'WhatsApp')}
            />
          </View>

          {/* 3. Telegram Webhook */}
          <Text style={styles.inputLabel}>📱 Telegram Alert Webhook URL / Bot Endpoint:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage"
              placeholderTextColor={Colors.textMuted}
              value={telegramUrl}
              onChangeText={setTelegramUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Button
              title={testingKey === 'Telegram' ? 'Testing...' : 'Test'}
              variant="outline"
              size="sm"
              loading={testingKey === 'Telegram'}
              onPress={() => handleTestWebhook(telegramUrl, 'Telegram')}
            />
          </View>
        </Card>
      </FadeInView>

      <FadeInView direction="up" delay={120}>
        <SectionHeader title="Automated Alert Rules" />
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Auto Webhook Alerts</Text>
              <Text style={styles.switchSubtitle}>Trigger webhooks automatically on match & application events</Text>
            </View>
            <Switch
              value={autoAlerts}
              onValueChange={setAutoAlerts}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <Text style={styles.inputLabel}>Target Role Keywords (comma separated):</Text>
          <TextInput
            style={styles.input}
            placeholder="Android, Kotlin, Jetpack Compose, Remote"
            placeholderTextColor={Colors.textMuted}
            value={keywords}
            onChangeText={setKeywords}
          />

          <Text style={styles.inputLabel}>Minimum Match Score for Alerts (%):</Text>
          <TextInput
            style={styles.input}
            placeholder="80"
            placeholderTextColor={Colors.textMuted}
            value={minScore}
            onChangeText={setMinScore}
            keyboardType="number-pad"
          />
        </Card>
      </FadeInView>

      <View style={styles.actions}>
        <Button
          title={saving ? 'Saving...' : 'Save Configuration ✅'}
          onPress={handleSave}
          loading={saving}
          size="lg"
        />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  heroTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: '900' },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: { marginBottom: Spacing.lg },
  inputLabel: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  switchTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  switchSubtitle: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  actions: { gap: Spacing.sm, marginBottom: Spacing.xxl },
});
