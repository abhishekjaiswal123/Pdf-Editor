export type CoordInput = { pageHeight: number; scale: number; x: number; y: number };

export function toPdfCoords({ pageHeight, scale, x, y }: CoordInput) {
  return { x: x / scale, y: pageHeight - y / scale };
}
