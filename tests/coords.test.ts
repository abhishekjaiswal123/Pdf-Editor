import { describe, it, expect } from 'vitest';
import { toPdfCoords } from '../src/export/coords';

describe('toPdfCoords', () => {
  it('flips Y from top-left to bottom-left and divides by scale', () => {
    expect(toPdfCoords({ pageHeight: 1000, scale: 2, x: 100, y: 500 }))
      .toEqual({ x: 50, y: 750 });
  });
});
