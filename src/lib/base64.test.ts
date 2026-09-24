import { describe, expect, it } from 'vitest';
import { base64ToBlob, blobToBase64 } from './base64';

describe('base64', () => {
  it('übersteht Hin- und Rückweg, auch bei großen Dateien', async () => {
    const bytes = new Uint8Array(200_000).map((_, i) => (i * 31) % 256);
    const b64 = await blobToBase64(new Blob([bytes], { type: 'image/jpeg' }));
    const back = base64ToBlob(b64, 'image/jpeg');
    expect(back.type).toBe('image/jpeg');
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(bytes);
  });
});
