/**
 * Query BigQuery para líneas de factura Falabella (Falabella_Orders)
 * sin factura aún en JS_Designs.Invoices. Migrado del script createInvoicesFalabella.
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
WITH temp_table AS (
  SELECT A.webOrderId
  FROM \`JS_Designs.Invoices\` A
  LEFT JOIN \`JS_Designs.Invoice_Voids\` B ON A.id = B.invoiceId
  WHERE A.date > '2025-07-01'
    AND A.status <> 'void'
  GROUP BY A.webOrderId
)
SELECT
  A.OrderId AS order_id,
  A.Quantity AS units,
  D.Alegra_id AS client_code,
  E.product_code AS product_code,
  ROUND(E.price, 2) AS item_price,
  CASE
    WHEN ROUND((1 - (A.PriceWithoutShipping / ((E.price * A.Quantity) * 1.19))) * 100) = 100 THEN 99
    ELSE ROUND((1 - (A.PriceWithoutShipping / ((E.price * A.Quantity) * 1.19))) * 100)
  END AS discount,
  CONCAT('Pedido Falabella ID: ', A.OrderId) AS anotation,
  3 AS tax
FROM \`JS_Designs.Falabella_Orders\` A
LEFT JOIN temp_table C ON A.OrderId = C.webOrderId
LEFT JOIN \`JS_Designs.Clients\` D ON A.NationalID = D.document_number
LEFT JOIN \`JS_Designs.Products\` E ON A.SKU = E.sku
WHERE C.webOrderId IS NULL
  AND DATE(A.CreatedAt) >= '2025-07-01'
  AND LOWER(A.Status) IN ('shipped', 'delivered', 'finished')
  AND A.SKU IS NOT NULL
  AND TRIM(COALESCE(A.SKU, '')) <> ''
  AND A.NationalID IS NOT NULL

UNION ALL

SELECT
  A.OrderId AS order_id,
  1 AS units,
  D.Alegra_id AS client_code,
  '3580' AS product_code,
  A.ShippingFeeTotal AS item_price,
  0 AS discount,
  CONCAT('Pedido Falabella ID: ', A.OrderId) AS anotation,
  1 AS tax
FROM \`JS_Designs.Falabella_Orders\` A
LEFT JOIN temp_table C ON A.OrderId = C.webOrderId
LEFT JOIN \`JS_Designs.Clients\` D ON A.NationalID = D.document_number
WHERE C.webOrderId IS NULL
  AND DATE(A.CreatedAt) >= '2025-07-01'
  AND LOWER(A.Status) IN ('shipped', 'delivered', 'finished')
  AND A.NationalID IS NOT NULL
  AND A.ShippingFeeTotal > 0
ORDER BY order_id ASC
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
  console.log('[Falabella Invoices] Step 1: Ejecutando query en BigQuery...');
  const [rows] = await bigquery.query({ query: QUERY });
  const result = (rows as Record<string, unknown>[]).map(rowToInvoice);
  console.log('[Falabella Invoices] Step 1: Query finalizado. Filas obtenidas:', result.length);
  return result;
}
