import { db, type EditsRow } from './db';
import type { Edit, FormFill } from '../store/types';

export async function putEdits(docId: string, edits: Edit[], formFills: FormFill[]) {
  await (await db()).put('edits', { docId, edits, formFills });
}

export async function getEdits(docId: string): Promise<EditsRow | undefined> {
  return (await db()).get('edits', docId);
}
