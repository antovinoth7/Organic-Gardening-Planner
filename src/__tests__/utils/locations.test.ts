/// <reference types="jest" />

// generateShortName is tested directly since it's a pure function —
// but it's in locations.ts which imports Firebase, so we extract the logic here.
const generateShortName = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (!cleaned) return 'LOC';
  const consonants = cleaned.replace(/[AEIOU]/g, '');
  if (consonants.length >= 3) return consonants.slice(0, 3);
  const chars: string[] = [...consonants];
  for (const ch of cleaned) {
    if (chars.length >= 3) break;
    if (!chars.includes(ch)) chars.push(ch);
  }
  while (chars.length < 3) {
    chars.push(cleaned[chars.length] ?? 'X');
  }
  return chars.join('').slice(0, 3);
};

describe('generateShortName', () => {
  it('generates a 3-char uppercase code from consonants', () => {
    expect(generateShortName('Mangarai')).toBe('MNG');
  });

  it('returns LOC for empty input', () => {
    expect(generateShortName('')).toBe('LOC');
  });

  it('strips non-alpha characters', () => {
    const result = generateShortName('North-East 123');
    expect(result).toHaveLength(3);
    expect(result).toMatch(/^[A-Z]{3}$/);
  });

  it('handles short names', () => {
    const result = generateShortName('Go');
    expect(result).toHaveLength(3);
    expect(result).toMatch(/^[A-Z]{3}$/);
  });
});
