import { db, type DocumentRow } from './db';

export async function putDocument(row: DocumentRow) {
  await (await db()).put('documents', row);
}

export async function getDocument(id: string): Promise<DocumentRow | undefined> {
  return (await db()).get('documents', id);
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const all = (await (await db()).getAll('documents')) as DocumentRow[];
  return all.sort((a, b) => b.lastOpened - a.lastOpened);
}
