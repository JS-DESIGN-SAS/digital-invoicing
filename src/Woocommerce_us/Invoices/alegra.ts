/**
 * Crear facturas en Alegra para WooCommerce US (USD, warehouse 32, document type 3).
 * Actualiza precisión decimal a 2 antes de facturar y la restaura al terminar.
 */

import { getAlegraSecrets } from '../../config/secrets';
import type { InvoiceRow } from './query';

const ALEGRA_INVOICES_URL = 'https://api.alegra.com/api/v1/invoices';
const ALEGRA_COMPANY_URL = 'https://api.alegra.com/api/v1/company';

function dateColombia(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() + -5 * 60) * 60 * 1000);
}

function groupByOrderId(rows: InvoiceRow[]): Map<string, InvoiceRow[]> {
  const map = new Map<string, InvoiceRow[]>();
  for (const row of rows) {
    const list = map.get(row.id) ?? [];
    list.push(row);
    map.set(row.id, list);
  }
  return map;
}

function buildInvoicePayload(
  orderId: string,
  rows: InvoiceRow[],
  trm: number
): { payload: unknown; totalAmount: number } {
  const items: {
    id: string;
    quantity: number;
    discount: number;
    price: number;
    tax: { id: number }[];
    description?: string;
  }[] = [];
  let totalAmount = 0;
  let clientCode = '';
  let anotation = '';

  for (const row of rows) {
    if (!row.product_code) continue;
    items.push({
      id: row.product_code,
      quantity: row.quantity,
      discount: row.discount,
      price: row.item_price,
      tax: [{ id: row.tax }],
      description: row.description || undefined,
    });
    clientCode = row.client_code;
    anotation = row.anotation;
    const base = row.quantity * row.item_price * ((100 - row.discount) / 100);
    totalAmount += row.tax === 3 ? base * 1.19 : base;
  }

  const totalRounded = Number(totalAmount.toFixed(2));
  const date = dateColombia();
  const dateStr = date.toISOString();

  const payload = {
    items,
    date: dateStr,
    client: { id: clientCode },
    document: { type: 3 },
    paymentMethod: 'DEBIT_TRANSFER',
    paymentForm: 'CASH',
    dueDate: dateStr,
    warehouse: 32,
    status: 'open',
    stamp: { generateStamp: true },
    payments: [
      {
        date: dateStr,
        account: { id: 1 },
        amount: totalRounded,
        currency: { code: 'USD', exchangeRate: trm },
      },
    ],
    anotation,
    currency: { code: 'USD', exchangeRate: trm },
  };

  return { payload, totalAmount: totalRounded };
}

export interface InvoiceResult {
  orderId: string;
  ok: boolean;
  status: number;
  body: string;
}

async function updateCompanyDecimalPrecision(
  token: string,
  email: string,
  decimalPrecision: number
): Promise<void> {
  const auth = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  const res = await fetch(ALEGRA_COMPANY_URL, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify({ decimalPrecision }),
  });
  if (!res.ok) {
    console.warn('[Woocommerce US Invoices Alegra] PUT company precision:', res.status, await res.text());
  }
}

async function postWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, options);
    if (res.status >= 500 && res.status <= 599) {
      attempt++;
      if (attempt > maxRetries) {
        return res;
      }
      const delay = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return res;
  }
}

export async function createInvoicesInAlegra(
  rows: InvoiceRow[],
  trm: number
): Promise<InvoiceResult[]> {
  const { token, email } = await getAlegraSecrets();
  const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  const groups = groupByOrderId(rows);
  const results: InvoiceResult[] = [];
  const orderIds = Array.from(groups.keys());

  for (let i = 0; i < orderIds.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 3000));
    const orderId = orderIds[i];
    const orderRows = groups.get(orderId)!;
    const { payload, totalAmount } = buildInvoicePayload(orderId, orderRows, trm);
    const pl = payload as { items: unknown[] };
    if (pl.items.length === 0) {
      console.log('[Woocommerce US Invoices Alegra] Orden', orderId, ': sin ítems, se omite.');
      continue;
    }

    console.log('[Woocommerce US Invoices Alegra] Enviando factura orden', orderId, ':', JSON.stringify(payload));

    try {
      const res = await postWithRetry(
        ALEGRA_INVOICES_URL,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: authHeader,
            'Alegra-Authorization': `Bearer ${token}`,
            'X-Request-Key': `invoice-us-${orderId}`,
          },
          body: JSON.stringify(payload),
        },
        5
      );
      const body = await res.text();
      const ok = res.ok;
      results.push({ orderId, ok, status: res.status, body });
      console.log('[Woocommerce US Invoices Alegra] Respuesta orden', orderId, ':', JSON.stringify({ status: res.status, ok, body }));
    } catch (err) {
      const msg = String(err);
      console.error('[Woocommerce US Invoices Alegra] Error orden', orderId, ':', msg);
      results.push({ orderId, ok: false, status: 0, body: msg });
    }
  }

  return results;
}

export async function setPrecisionAndCreateInvoices(
  rows: InvoiceRow[],
  trm: number
): Promise<InvoiceResult[]> {
  const { token, email } = await getAlegraSecrets();

  await updateCompanyDecimalPrecision(token, email, 2);
  try {
    return await createInvoicesInAlegra(rows, trm);
  } finally {
    await updateCompanyDecimalPrecision(token, email, 0);
  }
}
