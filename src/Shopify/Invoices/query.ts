/**
 * Query BigQuery para líneas de factura Shopify (Orders + Order_details)
 * sin factura aún en JS_Designs.Invoices. Migrado del script createInvoices.
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
  SELECT *
  FROM \`JS_Designs.Invoices\` A
  WHERE A.date > '2025-08-01' AND A.status <> 'void'
)
SELECT DISTINCT
  A.id,
  B.quantity,
  CASE WHEN A.client_Id LIKE 'CCundefined' THEN '36787' ELSE D.Alegra_id END AS client_code,
  CASE WHEN B.sku LIKE '111111%' THEN '4409' ELSE E.product_code END AS product_code,
  CASE WHEN B.sku LIKE '111111%' THEN B.subtotal ELSE ROUND(E.price, 2) END AS item_price,
  CASE
      WHEN B.sku LIKE '111111%' THEN 0.0
      WHEN ROUND((1 - (B.Total_amount / ((E.price * B.quantity) * 1.19))) * 100, 1) = 100 THEN 99.9
      ELSE ROUND((1 - (B.Total_amount / ((E.price * B.quantity) * 1.19))) * 100, 1)
    END AS discount,

  CONCAT('Pedido Web Order ID: ', A.id) AS anotation,
  3 AS tax
FROM \`JS_Designs.Orders\` A
INNER JOIN \`JS_Designs.Order_details\` B ON A.ID = B.orderId AND DATE(A.date) = DATE(B.dateTime)
LEFT JOIN temp_table C ON A.ID = C.webOrderId
LEFT JOIN \`JS_Designs.Clients\` D
  ON REGEXP_REPLACE(
        REGEXP_REPLACE(
          A.client_id,
          r'^(?:TE|CC|NIT|PP|CE|TI|DIE|FOREIGN_NIT|NUIP|PEP)[_-]?',
          ''
        ),
        r'[-\s\.,;]',
        ''
      ) = REPLACE(D.document_number, '-', '')
  OR REGEXP_REPLACE(
        REGEXP_REPLACE(A.client_id, r'^(?:TE|CC|NIT|PP|CE|TI|DIE|FOREIGN_NIT|NUIP|PEP)[_-]?', ''),
        r'[-_]',
        ''
      ) = CONCAT(D.document_number, D.dv)
LEFT JOIN \`JS_Designs.Products\` E ON B.SKU = E.sku
WHERE (C.webOrderId IS NULL OR C.webOrderId = '')
  AND A.status IN ('processing', 'addi-approved', 'PAID')
  AND DATE(A.date) >= '2025-12-01'
  AND A.client_Id NOT LIKE 'null%'
  AND DATE(B.dateTime) > '2024-11-01'
  AND CASE WHEN A.client_Id LIKE 'CCundefined' THEN '36787' ELSE D.Alegra_id END IS NOT NULL

UNION ALL

SELECT DISTINCT
  A.id,
  1,
  CASE WHEN A.client_Id LIKE 'CCundefined' THEN '36787' ELSE D.Alegra_id END AS client_code,
  '3579',
  A.shipping_total,
  0,
  CONCAT('Pedido Web Order ID: ', A.id),
  1
FROM \`JS_Designs.Orders\` A
INNER JOIN \`JS_Designs.Order_details\` B ON A.ID = B.orderId AND DATE(A.date) = DATE(B.dateTime)
LEFT JOIN temp_table C ON A.ID = C.webOrderId
LEFT JOIN \`JS_Designs.Clients\` D
  ON REGEXP_REPLACE(
        REGEXP_REPLACE(
          A.client_id,
          r'^(?:TE|CC|NIT|PP|CE|TI|DIE|FOREIGN_NIT|NUIP|PEP)[_-]?',
          ''
        ),
        r'[-\s\.,;]',
        ''
      ) = REPLACE(D.document_number, '-', '')
  OR REGEXP_REPLACE(
        A.client_id,
        r'^(?:TE|CC|NIT|PP|CE|TI|DIE|FOREIGN_NIT|NUIP|PEP)[_-]?',
        ''
      ) = CONCAT(D.document_number, D.dv)
WHERE (C.webOrderId IS NULL OR C.webOrderId = '')
  AND A.status IN ('processing', 'addi-approved', 'PAID')
  AND DATE(A.date) >= '2025-12-01'
  AND A.client_Id NOT LIKE 'null%'
  AND LOWER(A.shipping_method) NOT LIKE 'free%'
  AND A.shipping_total > 0
  AND CASE WHEN A.client_Id LIKE 'CCundefined' THEN '36787' ELSE D.Alegra_id END IS NOT NULL

ORDER BY 1 ASC
`;

function getVal(row: Record<string, unknown>, key: string): string | number {
  const v = row[key] ?? row[key.toLowerCase()];
  if (v == null) return key === 'quantity' || key === 'tax' || key === 'discount' ? 0 : '';
  if (typeof v === 'number') return v;
  return String(v).trim();
}

function rowToInvoice(row: Record<string, unknown>): InvoiceRow {
  return {
    id: String(getVal(row, 'id')),
    quantity: Number(getVal(row, 'quantity')),
    client_code: String(getVal(row, 'client_code')),
    product_code: String(getVal(row, 'product_code')),
    item_price: Number(getVal(row, 'item_price')),
    discount: Number(getVal(row, 'discount')),
    anotation: String(getVal(row, 'anotation')),
    tax: Number(getVal(row, 'tax')),
  };
}

export async function queryInvoiceLines(): Promise<InvoiceRow[]> {
  console.log('[Shopify Invoices] Step 1: Ejecutando query en BigQuery...');
  const [rows] = await bigquery.query({ query: QUERY });
  const result = (rows as Record<string, unknown>[]).map(rowToInvoice);
  console.log('[Shopify Invoices] Step 1: Query finalizado. Filas obtenidas:', result.length);
  return result;
}
