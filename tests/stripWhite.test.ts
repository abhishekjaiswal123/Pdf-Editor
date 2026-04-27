import { describe, it, expect } from 'vitest';
import { stripWhite } from '../src/signature/stripWhite';

describe('stripWhite', () => {
  it('makes near-white pixels transparent', () => {
    const data = new Uint8ClampedArray([255,255,255,255, 0,0,0,255]);
    const out = stripWhite(data, 240);
    expect(out[3]).toBe(0);
    expect(out[7]).toBe(255);
  });
});
