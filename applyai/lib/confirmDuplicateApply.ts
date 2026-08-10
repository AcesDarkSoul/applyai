import { Alert } from 'react-native';
import { findDuplicateApply } from '@/lib/duplicateApply';
import type { Application } from '@/types';

/**
 * If a duplicate job/company apply exists, show a warning and resolve true only if
 * the user chooses to continue.
 */
export function confirmDuplicateApply(
  applications: Application[],
  job: { id: string; company: string }
): Promise<boolean> {
  const hit = findDuplicateApply(applications, job);
  if (!hit) return Promise.resolve(true);

  return new Promise((resolve) => {
    Alert.alert(
      hit.kind === 'job' ? 'Already applied' : 'Same company',
      hit.message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Apply anyway', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
