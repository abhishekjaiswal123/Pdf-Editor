import { stripWhite } from './stripWhite';

export function UploadTab({ onResult }: { onResult: (dataUrl: string) => void }) {
  return (
    <div>
      <input type="file" accept="image/png,image/jpeg" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.src = url;
        await new Promise<void>((r) => { img.onload = () => r(); });
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const stripped = stripWhite(id.data, 235);
        ctx.putImageData(new ImageData(stripped, c.width, c.height), 0, 0);
        onResult(c.toDataURL('image/png'));
      }} />
    </div>
  );
}
