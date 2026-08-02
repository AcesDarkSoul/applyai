import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { Application } from '@/types';
import { triggerN8nApplicationWorkflow } from './automation';

/**
 * Generate CSV string from array of applications
 */
export function generateApplicationsCSV(applications: Application[]): string {
  const headers = ['ID', 'Job Title', 'Company', 'Status', 'Match Score (%)', 'Applied Date', 'Last Updated', 'Notes'];
  
  const rows = applications.map((app) => [
    `"${app.id}"`,
    `"${app.jobTitle.replace(/"/g, '""')}"`,
    `"${app.company.replace(/"/g, '""')}"`,
    `"${app.status}"`,
    `"${app.matchScore || 0}"`,
    `"${app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : ''}"`,
    `"${app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : ''}"`,
    `"${(app.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Download CSV file on Web or Copy CSV text on Mobile
 */
export async function exportApplicationsToCSV(applications: Application[]): Promise<{ success: boolean; message: string }> {
  if (applications.length === 0) {
    return { success: false, message: 'No applications recorded to export.' };
  }

  const csvContent = generateApplicationsCSV(applications);

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ApplyAI_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, message: 'CSV file downloaded successfully!' };
  }

  // Mobile / Fallback: Copy CSV data to clipboard
  await Clipboard.setStringAsync(csvContent);
  return { success: true, message: 'CSV application data copied to clipboard! You can paste it into Excel or Google Sheets.' };
}

/**
 * Sync batch applications to Google Sheets / n8n Webhook
 */
export async function syncAllApplicationsToWebhook(
  webhookUrl: string,
  applications: Application[]
): Promise<{ success: boolean; syncedCount: number; message: string }> {
  let count = 0;
  for (const app of applications) {
    const res = await triggerN8nApplicationWorkflow(app);
    if (res.success) count++;
  }

  return {
    success: count > 0,
    syncedCount: count,
    message: `Successfully synced ${count} of ${applications.length} applications to n8n Google Sheets & Telegram workflow!`,
  };
}
