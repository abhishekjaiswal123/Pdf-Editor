import { useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export type LoadedPdf = pdfjs.PDFDocumentProxy;

export function usePdfDocument(bytes: ArrayBuffer | null) {
  const [doc, setDoc] = useState<LoadedPdf | null>(null);
  useEffect(() => {
    if (!bytes) { setDoc(null); return; }
    let cancelled = false;
    (async () => {
      const loaded = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      if (!cancelled) setDoc(loaded);
    })();
    return () => { cancelled = true; };
  }, [bytes]);
  return doc;
}
