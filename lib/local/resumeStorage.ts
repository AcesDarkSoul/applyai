import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const META_KEY = '@applyai/resume_meta';
const URI_KEY = '@applyai/resume_uri';
const WEB_DB_NAME = 'applyai-resume';
const WEB_STORE = 'files';
const WEB_BASE64_KEY = 'resume_base64';

export interface LocalResumeMeta {
  fileName: string;
  mimeType: string;
  savedAt: string;
  size: number;
  localUri: string;
  storage?: 'filesystem' | 'indexeddb';
}

type PickerAsset = DocumentPicker.DocumentPickerAsset & { file?: File };

let webBlobUrl: string | null = null;

function getMimeType(fileName: string, mimeType?: string | null): string {
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  throw new Error('Only PDF and DOCX files are supported');
}

function getResumeDir(): string {
  const base = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!base) throw new Error('Local storage is not available on this device');
  return `${base}resume/`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function assetToBlob(file: PickerAsset): Promise<Blob> {
  if (Platform.OS === 'web' && file.file instanceof Blob) {
    return file.file;
  }
  const response = await fetch(file.uri);
  if (!response.ok) {
    throw new Error(`Could not read file (HTTP ${response.status})`);
  }
  return response.blob();
}

// --- Web: IndexedDB (expo-file-system has no documentDirectory on web) ---

function openWebDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Browser storage is not available'));
      return;
    }
    const request = indexedDB.open(WEB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(WEB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

async function webIdbSet(key: string, value: string): Promise<void> {
  const db = await openWebDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WEB_STORE, 'readwrite');
    tx.objectStore(WEB_STORE).put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function webIdbGet(key: string): Promise<string | null> {
  const db = await openWebDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WEB_STORE, 'readonly');
    const req = tx.objectStore(WEB_STORE).get(key);
    req.onsuccess = () => {
      db.close();
      resolve(typeof req.result === 'string' ? req.result : null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function webIdbDelete(key: string): Promise<void> {
  const db = await openWebDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WEB_STORE, 'readwrite');
    tx.objectStore(WEB_STORE).delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

function revokeWebBlobUrl(): void {
  if (webBlobUrl) {
    URL.revokeObjectURL(webBlobUrl);
    webBlobUrl = null;
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function saveResumeOnWeb(file: PickerAsset, mimeType: string): Promise<LocalResumeMeta> {
  const blob = await assetToBlob(file);
  if (blob.size > 10 * 1024 * 1024) {
    throw new Error('File is too large. Maximum size is 10 MB.');
  }

  const base64 = await blobToBase64(blob);
  revokeWebBlobUrl();
  await webIdbSet(WEB_BASE64_KEY, base64);

  const localUri = URL.createObjectURL(blob);
  webBlobUrl = localUri;

  const meta: LocalResumeMeta = {
    fileName: file.name,
    mimeType,
    savedAt: new Date().toISOString(),
    size: blob.size,
    localUri,
    storage: 'indexeddb',
  };

  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  await AsyncStorage.setItem(URI_KEY, localUri);
  return meta;
}

async function getWebResumeBase64(): Promise<string | null> {
  return webIdbGet(WEB_BASE64_KEY);
}

async function getWebResumeUri(meta: LocalResumeMeta): Promise<string | null> {
  const base64 = await getWebResumeBase64();
  if (!base64) return null;

  if (webBlobUrl) return webBlobUrl;

  const blob = base64ToBlob(base64, meta.mimeType);
  webBlobUrl = URL.createObjectURL(blob);
  return webBlobUrl;
}

async function deleteWebResume(): Promise<void> {
  revokeWebBlobUrl();
  try {
    await webIdbDelete(WEB_BASE64_KEY);
  } catch {
    // ignore
  }
}

// --- Native: expo-file-system ---

async function writeAssetToPath(file: PickerAsset, destUri: string): Promise<number> {
  const blob = await assetToBlob(file);
  await FileSystem.copyAsync({ from: file.uri, to: destUri });
  const info = await FileSystem.getInfoAsync(destUri);
  return info.exists && 'size' in info ? info.size ?? blob.size : blob.size;
}

async function saveResumeOnNative(file: PickerAsset, mimeType: string): Promise<LocalResumeMeta> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const dir = getResumeDir();
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const oldUri = await AsyncStorage.getItem(URI_KEY);
  if (oldUri) {
    try {
      await FileSystem.deleteAsync(oldUri, { idempotent: true });
    } catch {
      // ignore
    }
  }

  const destUri = `${dir}resume.${ext}`;
  const size = await writeAssetToPath(file, destUri);

  if (size > 10 * 1024 * 1024) {
    await FileSystem.deleteAsync(destUri, { idempotent: true });
    throw new Error('File is too large. Maximum size is 10 MB.');
  }

  const meta: LocalResumeMeta = {
    fileName: file.name,
    mimeType,
    savedAt: new Date().toISOString(),
    size,
    localUri: destUri,
    storage: 'filesystem',
  };

  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  await AsyncStorage.setItem(URI_KEY, destUri);
  return meta;
}

/** Save resume on device only — never uploads to Firebase Storage */
export async function saveResumeLocally(
  file: DocumentPicker.DocumentPickerAsset
): Promise<LocalResumeMeta> {
  const pickerFile = file as PickerAsset;
  const mimeType = getMimeType(file.name, file.mimeType);

  if (Platform.OS === 'web') {
    return saveResumeOnWeb(pickerFile, mimeType);
  }
  return saveResumeOnNative(pickerFile, mimeType);
}

export async function getLocalResumeMeta(): Promise<LocalResumeMeta | null> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalResumeMeta;
  } catch {
    return null;
  }
}

export async function getLocalResumeUri(): Promise<string | null> {
  const meta = await getLocalResumeMeta();
  if (!meta) return null;

  if (Platform.OS === 'web' || meta.storage === 'indexeddb') {
    return getWebResumeUri(meta);
  }

  const info = await FileSystem.getInfoAsync(meta.localUri);
  return info.exists ? meta.localUri : null;
}

export async function hasLocalResume(): Promise<boolean> {
  if (Platform.OS === 'web') {
    const base64 = await getWebResumeBase64();
    return !!base64;
  }
  return (await getLocalResumeUri()) !== null;
}

export async function deleteLocalResume(): Promise<void> {
  if (Platform.OS === 'web') {
    await deleteWebResume();
  } else {
    const uri = await AsyncStorage.getItem(URI_KEY);
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  }
  await AsyncStorage.removeItem(META_KEY);
  await AsyncStorage.removeItem(URI_KEY);
}

/** Read local resume as base64 for AI parsing via Cloud Function */
export async function readLocalResumeAsBase64(): Promise<{ base64: string; fileName: string } | null> {
  const meta = await getLocalResumeMeta();
  if (!meta) return null;

  if (Platform.OS === 'web' || meta.storage === 'indexeddb') {
    const base64 = await getWebResumeBase64();
    return base64 ? { base64, fileName: meta.fileName } : null;
  }

  const uri = await getLocalResumeUri();
  if (!uri) return null;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { base64, fileName: meta.fileName };
}

/** Share or download resume when applying — sends from local device */
export async function shareLocalResume(): Promise<boolean> {
  const meta = await getLocalResumeMeta();
  const uri = await getLocalResumeUri();
  if (!meta || !uri) return false;

  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = uri;
    link.download = meta.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  const Sharing = await import('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType: meta.mimeType,
    dialogTitle: `Share ${meta.fileName}`,
    UTI: meta.mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
  });
  return true;
}
