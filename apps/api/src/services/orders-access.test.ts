import { createHash } from 'node:crypto';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  orderFindFirst: vi.fn(
    async (_args: unknown) => null,
  ),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    order: {
      findFirst: mocks.orderFindFirst,
    },
  },
}));

import {
  getOrderByReference,
  OrderNotFoundError,
  submitPayment,
} from './orders.service.js';

describe('order public access security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('looks up an order using the SHA-256 hash of the access token', async () => {
    const reference = 'GOI-2026-000123';
    const accessToken =
      'test-access-token-with-enough-entropy-for-test';

    const expectedHash = createHash('sha256')
      .update(accessToken, 'utf8')
      .digest('hex');

    await getOrderByReference(
      reference,
      accessToken,
    );

    expect(
      mocks.orderFindFirst,
    ).toHaveBeenCalledTimes(1);

    expect(
      mocks.orderFindFirst,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          reference,
          accessTokenHash: expectedHash,
        },
      }),
    );

    expect(expectedHash).toHaveLength(64);
    expect(expectedHash).not.toBe(accessToken);
  });

  it('rejects payment submission when the token cannot access the order', async () => {
    const reference = 'GOI-2026-000123';
    const accessToken =
      'invalid-access-token-with-enough-length';

    await expect(
      submitPayment(
        reference,
        accessToken,
        {
          payerPhone: '+22670000000',
          transactionId: 'TEST-A2-INVALID',
        },
      ),
    ).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );

    expect(
      mocks.orderFindFirst,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          reference,
          accessTokenHash: createHash(
            'sha256',
          )
            .update(accessToken, 'utf8')
            .digest('hex'),
        },
      }),
    );
  });
});
