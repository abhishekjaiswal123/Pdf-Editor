import { openDB, type IDBPDatabase } from 'idb';
import type { Edit, FormFill } from '../store/types';

export type DocumentRow = { id: string; name: string; originalBytes: ArrayBuffer; lastOpened: number };
export type EditsRow = { docId: string; edits: Edit[]; formFills: FormFill[] };
export type SignatureRow = { id: string; dataUrl: string; createdAt: number };

let dbp: Promise<IDBPDatabase> | null = null;

/**
 * Reset the cached DB promise. In tests, also replace globalThis.indexedDB
 * with a fresh IDBFactory so the next openDB call starts from a clean state
 * without needing to await a deleteDatabase request.
 */
export async function _resetDb() {
  if (dbp) {
    try {
      const d = await dbp;
      d.close();
    } catch {
      // ignore — DB may already be in a bad state
    }
  }
  dbp = null;
  // Replace the global IDBFactory with a fresh instance so tests get a clean DB
  try {
    // Only available in test environments that use fake-indexeddb
    const { IDBFactory } = await import('fake-indexeddb');
    (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  } catch {
    // In production / browsers, skip — callers should not call _resetDb
  }
}

export function db() {
  if (!dbp) {
    dbp = openDB('pdf-editor', 1, {
      upgrade(d) {
        d.createObjectStore('documents', { keyPath: 'id' });
        d.createObjectStore('edits', { keyPath: 'docId' });
        d.createObjectStore('signatures', { keyPath: 'id' });
      },
    });
  }
  return dbp;
}
