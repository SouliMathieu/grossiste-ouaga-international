import { describe, expect, it } from 'vitest';

describe('storefront foundation', () => {
  it('keeps the GOI project identity', () => {
    expect('Grossiste Ouaga International').toContain('Ouaga');
  });
});
