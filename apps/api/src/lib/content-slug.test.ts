import {
  describe,
  expect,
  it,
} from 'vitest';
import { slugifyContent } from './content-slug.js';

describe('content slug', () => {
  it('normalizes French accents and spaces', () => {
    expect(
      slugifyContent(
        'Installation électrique à Ouagadougou',
      ),
    ).toBe(
      'installation-electrique-a-ouagadougou',
    );
  });

  it('uses a safe fallback for an empty slug', () => {
    expect(
      slugifyContent('---'),
    ).toBe('contenu');
  });

  it('limits the slug size', () => {
    expect(
      slugifyContent('a'.repeat(300)),
    ).toHaveLength(175);
  });
});
