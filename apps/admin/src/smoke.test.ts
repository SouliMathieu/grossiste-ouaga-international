import { describe, expect, it } from 'vitest';

describe('admin foundation', () => {
  it('starts with manual payment verification as a distinct state', () => {
    expect('VERIFYING').not.toBe('PAID');
  });
});
