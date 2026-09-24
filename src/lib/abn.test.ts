import { describe, expect, it } from 'vitest';
import { formatAbn, isValidAbn } from './abn';

describe('ABN', () => {
  it('akzeptiert eine gültige ABN, auch mit Leerzeichen', () => {
    // Beispiel-ABN aus der ATO-Dokumentation
    expect(isValidAbn('51824753556')).toBe(true);
    expect(isValidAbn('51 824 753 556')).toBe(true);
  });

  it('erkennt Tippfehler', () => {
    expect(isValidAbn('51824753557')).toBe(false);
    expect(isValidAbn('15824753556')).toBe(false);
    expect(isValidAbn('5182475355')).toBe(false);
  });

  it('formatiert in 2-3-3-3-Blöcken', () => {
    expect(formatAbn('51824753556')).toBe('51 824 753 556');
  });
});
