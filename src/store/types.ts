export type EditBase = { id: string; pageIndex: number };

export type TextEdit = EditBase & {
  kind: 'text';
  x: number; y: number;
  text: string;
  fontSize: number;
  color: string;
};

export type ImageEdit = EditBase & {
  kind: 'image';
  x: number; y: number; w: number; h: number; rotation: number;
  dataUrl: string;
  isSignature?: boolean;
};

export type StrokeEdit = EditBase & {
  kind: 'stroke';
  points: number[];
  color: string;
  width: number;
  opacity: number;
};

export type ShapeEdit = EditBase & {
  kind: 'shape';
  type: 'rect' | 'line';
  x: number; y: number; w: number; h: number;
  stroke: string; fill: string | null;
};

export type Edit = TextEdit | ImageEdit | StrokeEdit | ShapeEdit;

export type FormFill = { fieldName: string; value: string | boolean };

export type DocState = {
  docId: string | null;
  name: string;
  bytes: ArrayBuffer | null;
  edits: Edit[];
  formFills: FormFill[];
};
