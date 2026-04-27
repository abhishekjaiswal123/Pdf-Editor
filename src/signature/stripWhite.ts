export function stripWhite(data: Uint8ClampedArray, threshold: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i] >= threshold && out[i+1] >= threshold && out[i+2] >= threshold) {
      out[i+3] = 0;
    }
  }
  return out;
}
