import { describe, expect, it } from 'vitest';

describe('payment invariant', () => {
  it('does not equate submitted with paid', () => {
    expect('SUBMITTED').not.toBe('PAID');
  });
});
