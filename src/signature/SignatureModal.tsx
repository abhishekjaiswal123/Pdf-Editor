import { useState } from 'react';
import { DrawTab } from './DrawTab';
import { UploadTab } from './UploadTab';
import { SavedTab } from './SavedTab';
import { putSignature } from '../persistence/signatures';

type Tab = 'draw' | 'upload' | 'saved';

export function SignatureModal({ onClose, onUse }: { onClose: () => void; onUse: (dataUrl: string) => void }) {
  const [tab, setTab] = useState<Tab>('draw');
  const [save, setSave] = useState(false);

  const handle = async (dataUrl: string) => {
    if (save) await putSignature({ id: crypto.randomUUID(), dataUrl, createdAt: Date.now() });
    onUse(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-4 w-[560px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2 mb-3">
          {(['draw','upload','saved'] as Tab[]).map((t) => (
            <button key={t}
              className={`px-3 py-1 rounded ${tab===t ? 'bg-blue-600 text-white' : 'border'}`}
              onClick={() => setTab(t)}>{t}</button>
          ))}
          <button className="ml-auto" onClick={onClose}>×</button>
        </div>
        {tab === 'draw'   && <DrawTab onResult={handle} />}
        {tab === 'upload' && <UploadTab onResult={handle} />}
        {tab === 'saved'  && <SavedTab onResult={handle} />}
        <label className="mt-3 inline-flex gap-2 items-center">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
          Save for next time
        </label>
      </div>
    </div>
  );
}
