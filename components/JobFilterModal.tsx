import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '@/constants/theme';
import type { JobFilterParams } from '@/types';

interface JobFilterModalProps {
  visible: boolean;
  filters: JobFilterParams;
  onClose: () => void;
  onApplyFilters: (newFilters: JobFilterParams) => void;
  onResetFilters: () => void;
}

const WORK_MODES = [
  { key: 'all', label: 'All Modes' },
  { key: 'remote', label: '🌐 Remote' },
  { key: 'hybrid', label: '🏢 Hybrid' },
  { key: 'onsite', label: '📍 Onsite' },
];

const EMP_TYPES = [
  { key: 'all', label: 'All Types' },
  { key: 'full-time', label: 'Full-Time' },
  { key: 'contract', label: 'Contract' },
  { key: 'internship', label: 'Internship' },
];

const SENIORITY_LEVELS = [
  { key: 'all', label: 'All Levels' },
  { key: 'entry', label: 'Junior / Entry' },
  { key: 'mid', label: 'Mid Level' },
  { key: 'senior', label: 'Senior' },
  { key: 'lead', label: 'Lead / Architect' },
];

const MATCH_SCORES = [
  { key: 0, label: 'All Scores' },
  { key: 80, label: '🌟 80%+ Top Matches' },
  { key: 70, label: '⚡ 70%+ Good Fit' },
];

export function JobFilterModal({
  visible,
  filters,
  onClose,
  onApplyFilters,
  onResetFilters,
}: JobFilterModalProps) {
  const [tempFilters, setTempFilters] = React.useState<JobFilterParams>(filters);

  React.useEffect(() => {
    setTempFilters(filters);
  }, [filters, visible]);

  if (!visible) return null;

  const updateField = (key: keyof JobFilterParams, value: any) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetContainer}>
              <View style={styles.dragHandle} />

              <View style={styles.header}>
                <Text style={styles.headerTitle}>🎛️ Filter Jobs</Text>
                <Pressable onPress={onResetFilters} style={styles.resetBtn}>
                  <Text style={styles.resetText}>Reset All</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {/* Work Mode */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Work Mode</Text>
                  <View style={styles.chipRow}>
                    {WORK_MODES.map((m) => {
                      const isActive = (tempFilters.workMode || 'all') === m.key;
                      return (
                        <Pressable
                          key={m.key}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => updateField('workMode', m.key)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{m.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Seniority */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Seniority Level</Text>
                  <View style={styles.chipRow}>
                    {SENIORITY_LEVELS.map((s) => {
                      const isActive = (tempFilters.seniority || 'all') === s.key;
                      return (
                        <Pressable
                          key={s.key}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => updateField('seniority', s.key)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{s.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Employment Type */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Employment Type</Text>
                  <View style={styles.chipRow}>
                    {EMP_TYPES.map((e) => {
                      const isActive = (tempFilters.employmentType || 'all') === e.key;
                      return (
                        <Pressable
                          key={e.key}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => updateField('employmentType', e.key)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{e.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Match Score Threshold */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterTitle}>Minimum AI Match Score</Text>
                  <View style={styles.chipRow}>
                    {MATCH_SCORES.map((ms) => {
                      const isActive = (tempFilters.minMatchScore || 0) === ms.key;
                      return (
                        <Pressable
                          key={ms.key}
                          style={[styles.chip, isActive && styles.chipActive]}
                          onPress={() => updateField('minMatchScore', ms.key)}
                        >
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{ms.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.footerActions}>
                <Pressable
                  style={styles.applyBtn}
                  onPress={() => {
                    onApplyFilters(tempFilters);
                    onClose();
                  }}
                >
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  resetBtn: {
    padding: Spacing.xs,
  },
  resetText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  scrollBody: {
    marginBottom: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary + '18',
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  footerActions: {
    paddingTop: Spacing.sm,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  applyBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
});
