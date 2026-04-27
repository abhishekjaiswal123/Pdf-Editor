import { db, type SignatureRow } from './db';

export async function putSignature(row: SignatureRow) {
  await (await db()).put('signatures', row);
}

export async function listSignatures(): Promise<SignatureRow[]> {
  const all = (await (await db()).getAll('signatures')) as SignatureRow[];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSignature(id: string) {
  await (await db()).delete('signatures', id);
}
