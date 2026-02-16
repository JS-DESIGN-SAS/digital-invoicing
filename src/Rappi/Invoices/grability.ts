/**
 * API Grability (Rappi): login para token y GET order para obtener total_with_discount.
 */

import { getGrabilitySecrets } from '../../config/secrets';

const LOGIN_URL = 'https://services.grability.rappi.com/api/open-api/login';
const ORDERS_BASE_URL = 'https://services.grability.rappi.com/api/open-api/v1/orders';

export async function getGrabilityAccessToken(): Promise<string> {
  const { clientId, clientSecret } = await getGrabilitySecrets();
  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!res.ok) {
    throw new Error(`Grability login failed: ${res.status} ${res.statusText}`);
  }
  const result = (await res.json()) as { access_token?: string };
  if (!result.access_token) {
    throw new Error('No se recibió un token válido de Grability');
  }
  return result.access_token;
}

/**
 * Obtiene el total_with_discount del pedido desde Grability.
 * Respuesta puede ser un objeto con price_summary o un array con un objeto.
 * @returns total_with_discount en COP o null si no se pudo obtener
 */
export async function getOrderTotalWithDiscount(
  orderId: string,
  token: string
): Promise<number | null> {
  const url = `${ORDERS_BASE_URL}/${orderId}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn('[Rappi Grability] GET order', orderId, ':', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as
      | { price_summary?: { total_with_discount?: number } }
      | Array<{ price_summary?: { total_with_discount?: number } }>;
    const order = Array.isArray(data) ? data[0] : data;
    const total = order?.price_summary?.total_with_discount;
    if (total == null || typeof total !== 'number') {
      console.warn('[Rappi Grability] total_with_discount no encontrado para orden', orderId);
      return null;
    }
    return total;
  } catch (err) {
    console.warn('[Rappi Grability] Error GET order', orderId, ':', err);
    return null;
  }
}
