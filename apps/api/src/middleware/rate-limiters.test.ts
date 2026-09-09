import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  RATE_LIMIT_POLICIES,
} from './rate-limiters.js';

describe('rate limit policies', () => {
  it('keeps the expected security limits', () => {
    expect(
      RATE_LIMIT_POLICIES.adminLogin,
    ).toEqual({
      windowMs: 15 * 60 * 1000,
      limit: 10,
    });

    expect(
      RATE_LIMIT_POLICIES.orderCreate.limit,
    ).toBe(20);

    expect(
      RATE_LIMIT_POLICIES.orderLookup,
    ).toEqual({
      windowMs: 5 * 60 * 1000,
      limit: 60,
    });

    expect(
      RATE_LIMIT_POLICIES.paymentSubmit.limit,
    ).toBe(20);

    expect(
      RATE_LIMIT_POLICIES.contact,
    ).toEqual({
      windowMs: 30 * 60 * 1000,
      limit: 10,
    });
  });
});
