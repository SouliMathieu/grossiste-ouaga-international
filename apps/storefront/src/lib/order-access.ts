const ORDER_ACCESS_PREFIX =
  'goi_order_access:';

function getStorageKey(reference: string) {
  return `${ORDER_ACCESS_PREFIX}${reference}`;
}

export function setOrderAccessToken(
  reference: string,
  token: string,
) {
  sessionStorage.setItem(
    getStorageKey(reference),
    token,
  );
}

export function getOrderAccessToken(
  reference: string,
) {
  return sessionStorage.getItem(
    getStorageKey(reference),
  );
}

export function removeOrderAccessToken(
  reference: string,
) {
  sessionStorage.removeItem(
    getStorageKey(reference),
  );
}
