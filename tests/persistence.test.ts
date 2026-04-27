import { describe, it, expect, beforeEach } from 'vitest';
import { putDocument, getDocument, listDocuments } from '../src/persistence/documents';
import { putEdits, getEdits } from '../src/persistence/edits';
import { putSignature, listSignatures } from '../src/persistence/signatures';
import { _resetDb } from '../src/persistence/db';

describe('persistence', () => {
  beforeEach(async () => {
    await _resetDb();
  });

  it('roundtrips a document', async () => {
    const bytes = new Uint8Array([1,2,3]).buffer;
    await putDocument({ id: 'd1', name: 'a.pdf', originalBytes: bytes, lastOpened: 1 });
    const got = await getDocument('d1');
    expect(got?.name).toBe('a.pdf');
    expect(new Uint8Array(got!.originalBytes)[0]).toBe(1);
  });

  it('lists documents most-recent first', async () => {
    await putDocument({ id: 'a', name: 'a', originalBytes: new ArrayBuffer(0), lastOpened: 1 });
    await putDocument({ id: 'b', name: 'b', originalBytes: new ArrayBuffer(0), lastOpened: 2 });
    const list = await listDocuments();
    expect(list.map(d => d.id)).toEqual(['b', 'a']);
  });

  it('roundtrips edits', async () => {
    await putEdits('d1', [{ id: 'e1', pageIndex: 0, kind: 'text', x:0,y:0,text:'',fontSize:16,color:'#000' }], []);
    const got = await getEdits('d1');
    expect(got?.edits).toHaveLength(1);
  });

  it('roundtrips signatures', async () => {
    await putSignature({ id: 's1', dataUrl: 'data:image/png;base64,xx', createdAt: 1 });
    const list = await listSignatures();
    expect(list).toHaveLength(1);
  });
});
