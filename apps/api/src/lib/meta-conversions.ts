import { createHash } from 'node:crypto';

type MetaOrderItem = {
  productId: number | null;
  sku: string;
  productName: string;
  unitPrice: unknown;
  quantity: number;
};

type MetaLeadOrder = {
  reference: string;
  subtotal: unknown;
  customerEmail: string | null;
  customerPhone: string;
  items: MetaOrderItem[];
};

function hashValue(
  value: string,
) {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function normalizePhone(
  value: string,
) {
  return value.replace(
    /\D/g,
    '',
  );
}

function getConfig() {
  const pixelId =
    process.env.META_PIXEL_ID
      ?.trim();

  const accessToken =
    process.env
      .META_CONVERSIONS_ACCESS_TOKEN
      ?.trim();

  const graphVersion =
    process.env
      .META_GRAPH_API_VERSION
      ?.trim();

  const storefrontUrl =
    process.env
      .PUBLIC_STOREFRONT_URL
      ?.trim();

  if (
    !pixelId ||
    !accessToken ||
    !graphVersion ||
    !storefrontUrl
  ) {
    return null;
  }

  return {
    pixelId,
    accessToken,
    graphVersion,
    storefrontUrl:
      storefrontUrl.replace(
        /\/+$/,
        '',
      ),
    testEventCode:
      process.env
        .META_TEST_EVENT_CODE
        ?.trim() || null,
  };
}

export async function sendMetaLeadConversion(
  order: MetaLeadOrder,
): Promise<void> {
  const config = getConfig();

  if (!config) {
    return;
  }

  try {
    const userData: Record<
      string,
      string[]
    > = {};

    const normalizedPhone =
      normalizePhone(
        order.customerPhone,
      );

    if (normalizedPhone) {
      userData.ph = [
        hashValue(
          normalizedPhone,
        ),
      ];
    }

    if (order.customerEmail) {
      const normalizedEmail =
        normalizeEmail(
          order.customerEmail,
        );

      if (normalizedEmail) {
        userData.em = [
          hashValue(
            normalizedEmail,
          ),
        ];
      }
    }

    const payload = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(
            Date.now() / 1000,
          ),
          event_id:
            `order-${order.reference}`,
          action_source: 'website',

          event_source_url:
            `${config.storefrontUrl}/commande/${encodeURIComponent(
              order.reference,
            )}/paiement`,

          user_data: userData,

          custom_data: {
            currency: 'XOF',
            value: Number(
              order.subtotal,
            ),
            order_id:
              order.reference,

            content_type:
              'product',

            content_ids:
              order.items.map(
                (item) =>
                  item.productId !== null
                    ? String(
                        item.productId,
                      )
                    : item.sku,
              ),

            contents:
              order.items.map(
                (item) => ({
                  id:
                    item.productId !== null
                      ? String(
                          item.productId,
                        )
                      : item.sku,
                  quantity:
                    item.quantity,
                  item_price:
                    Number(
                      item.unitPrice,
                    ),
                }),
              ),
          },
        },
      ],

      ...(config.testEventCode
        ? {
            test_event_code:
              config.testEventCode,
          }
        : {}),
    };

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () =>
          controller.abort(),
        3000,
      );

    try {
      const response =
        await fetch(
          `https://graph.facebook.com/${encodeURIComponent(
            config.graphVersion,
          )}/${encodeURIComponent(
            config.pixelId,
          )}/events`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${config.accessToken}`,
            },

            body:
              JSON.stringify(
                payload,
              ),

            signal:
              controller.signal,
          },
        );

      if (!response.ok) {
        const details =
          await response
            .text()
            .catch(() => '');

        console.error(
          'Meta Conversions API : envoi Lead refusé.',
          {
            status:
              response.status,
            details:
              details.slice(
                0,
                500,
              ),
          },
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error(
      'Meta Conversions API indisponible :',
      error instanceof Error
        ? error.message
        : 'Erreur inconnue',
    );
  }
}
