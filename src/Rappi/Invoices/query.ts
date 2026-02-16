/**
 * Query BigQuery para líneas de factura Rappi (Orders_rappi)
 * sin factura aún en JS_Designs.Invoices. Migrado del script createInvoicesRappi.
 */

import { bigquery } from '../../config/bigquery';

export interface InvoiceRow {
  id: string;
  quantity: number;
  client_code: string;
  product_code: string;
  item_price: number;
  discount: number;
  anotation: string;
  tax: number;
}

const QUERY = `
WITH clients_first AS (
  SELECT * FROM (
    SELECT
      C.*,
      ROW_NUMBER() OVER (PARTITION BY C.document_number ORDER BY C.Alegra_id ASC) AS rn
    FROM \`JS_Designs.Clients\` C
  )
  WHERE rn = 1
)
SELECT
  A.order_id,
  A.units,
  D.Alegra_id AS client_code,
  E.product_code AS product_code,
  ROUND(E.price, 2) AS item_price,
  CASE
    WHEN ROUND((1 - (A.discounted_price / ((E.price * A.units) * 1.19))) * 100) = 100 THEN 99
    ELSE ROUND((1 - (A.discounted_price / ((E.price * A.units) * 1.19))) * 100)
  END AS discount,
  CONCAT('Pedido Rappi ID: ', A.order_id) AS anotation,
  3 AS tax
FROM \`JS_Designs.Orders_rappi\` A
LEFT JOIN clients_first D ON A.user_id_document = D.document_number
LEFT JOIN \`JS_Designs.Products\` E ON A.SKU = E.sku
LEFT JOIN \`JS_Designs.Invoices\` F ON A.order_id = F.webOrderId
WHERE F.webOrderId IS NULL
  AND DATE(A.created_at) >= '2025-01-01'
  AND A.order_status = 'finished'
  AND A.SKU IS NOT NULL
  AND TRIM(COALESCE(A.SKU, '')) <> ''
  AND A.user_id_document IS NOT NULL
ORDER BY A.created_at ASC
`;

function getVal(row: Record<string, unknown>, key: string): string | number {
  const v = row[key] ?? row[key.toLowerCase()];
  if (v == null) return key === 'quantity' || key === 'tax' || key === 'discount' ? 0 : '';
  if (typeof v === 'number') return v;
  return String(v).trim();
}

function rowToInvoice(row: Record<string, unknown>): InvoiceRow {
  return {
    id: String(getVal(row, 'order_id')),
    quantity: Number(getVal(row, 'units')),
    client_code: String(getVal(row, 'client_code')),
    product_code: String(getVal(row, 'product_code')),
    item_price: Number(getVal(row, 'item_price')),
    discount: Number(getVal(row, 'discount')),
    anotation: String(getVal(row, 'anotation')),
    tax: Number(getVal(row, 'tax')),
  };
}

export async function queryInvoiceLines(): Promise<InvoiceRow[]> {
  console.log('[Rappi Invoices] Step 1: Ejecutando query en BigQuery...');
  const [rows] = await bigquery.query({ query: QUERY });
  const result = (rows as Record<string, unknown>[]).map(rowToInvoice);
  console.log('[Rappi Invoices] Step 1: Query finalizado. Filas obtenidas:', result.length);
  return result;
}
