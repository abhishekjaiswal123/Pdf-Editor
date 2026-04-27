import { useDocStore } from '../store/docStore';
import { EmptyState } from './EmptyState';
import { usePdfDocument } from '../pdf/usePdfDocument';
import { PageCanvas } from '../pdf/PageCanvas';

export default function App() {
  const bytes = useDocStore((s) => s.bytes);
  const doc = usePdfDocument(bytes);
  if (!bytes || !doc) return <EmptyState />;
  return (
    <div className="flex flex-col gap-4 items-center p-4">
      {Array.from({ length: doc.numPages }).map((_, i) => (
        <PageCanvas key={i} doc={doc} pageIndex={i} scale={1.25} />
      ))}
    </div>
  );
}
