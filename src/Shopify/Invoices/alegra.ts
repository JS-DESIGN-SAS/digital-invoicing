/**
 * Crear facturas en Alegra a partir de las líneas del query Shopify (Orders + Order_details).
 */

import { getAlegraSecrets } from '../../config/secrets';
import type { InvoiceRow } from './query';

const ALEGRA_INVOICES_URL = 'https://api.alegra.com/api/v1/invoices';

/** Fecha actual en zona Colombia (UTC-5). */
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

/** Arma el payload de una factura por orden (solo líneas con product_code). */
function buildInvoicePayload(orderId: string, rows: InvoiceRow[]): unknown {
  const items: { id: string; quantity: number; discount: number; price: number; tax: { id: number }[] }[] = [];
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
    });
    clientCode = row.client_code;
    anotation = row.anotation;
    const itemTotal = row.quantity * row.item_price * ((100 - row.discount) / 100);
    totalAmount += row.tax === 3 ? itemTotal * 1.19 : itemTotal;
  }

  const totalRounded = Math.round(totalAmount);
  const date = dateColombia();
  const dateStr = date.toISOString();

  return {
    items,
    date: dateStr,
    client: { id: clientCode },
    paymentMethod: 'DEBIT_TRANSFER',
    paymentForm: 'CASH',
    dueDate: dateStr,
    warehouse: 1,
    status: 'open',
    payments: [
      {
        date: dateStr,
        account: { id: 1 },
        amount: totalRounded,
      },
    ],
    stamp: { generateStamp: true },
    anotation,
    seller: 21,
  };
}

export interface InvoiceResult {
  orderId: string;
  ok: boolean;
  status: number;
  body: string;
}

/**
 * Agrupa las filas por orden, crea una factura en Alegra por cada orden
 * y devuelve el resultado de cada una. Log por factura: payload y respuesta.
 */
export async function createInvoicesInAlegra(rows: InvoiceRow[]): Promise<InvoiceResult[]> {
  const { token, email } = await getAlegraSecrets();
  const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  const groups = groupByOrderId(rows);
  const results: InvoiceResult[] = [];
  const orderIds = Array.from(groups.keys());

  for (let i = 0; i < orderIds.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 3000)); // 3 s entre facturas
    const orderId = orderIds[i];
    const orderRows = groups.get(orderId)!;
    const payload = buildInvoicePayload(orderId, orderRows) as { items: unknown[] };
    if (payload.items.length === 0) {
      console.log('[Shopify Invoices Alegra] Orden', orderId, ': sin ítems con product_code, se omite.');
      continue;
    }

    console.log('[Shopify Invoices Alegra] Enviando factura orden', orderId, ':', JSON.stringify(payload));

    try {
      const res = await fetch(ALEGRA_INVOICES_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'Alegra-Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.text();
      const ok = res.ok;
      results.push({ orderId, ok, status: res.status, body });
      console.log('[Shopify Invoices Alegra] Respuesta orden', orderId, ':', JSON.stringify({ status: res.status, ok, body }));
    } catch (err) {
      const msg = String(err);
      console.error('[Shopify Invoices Alegra] Error orden', orderId, ':', msg);
      results.push({ orderId, ok: false, status: 0, body: msg });
    }
  }

  return results;
}
