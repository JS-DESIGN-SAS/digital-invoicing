/**
 * Query BigQuery para líneas de factura WooCommerce US (Orders_US + Order_details_US)
 * sin factura en JS_Designs.Invoices (store_id 32). Migrado del script createInvoicesUS.
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
  description: string;
}

const QUERY = `
WITH temp_table AS (
  SELECT
    A.*,
    REGEXP_REPLACE(A.webOrderId, r'-.*$', '') AS webOrderId_clean
  FROM \`JS_Designs.Invoices\` A
  LEFT JOIN \`JS_Designs.Invoice_Voids\` B ON A.id = B.invoiceId
  WHERE A.date > '2024-08-01'
    AND A.status <> 'void'
    AND A.store_id = "32"
    AND B.invoiceId IS NULL
)
SELECT DISTINCT
  A.id,
  B.quantity,
  IF(A.Client_Id LIKE '%null%', '48762', D.Alegra_id) AS client_code,
  CASE WHEN B.sku LIKE '111111%' THEN '4409' ELSE E.product_code END AS product_code,
  CASE
    WHEN B.sku LIKE '111111%' THEN B.subtotal
    ELSE ROUND(E.International_Price, 2)
  END AS item_price,
  CASE
    WHEN B.sku LIKE '111111%' THEN 0
    WHEN ROUND((1 - (B.Total_amount / (E.International_Price * B.quantity))) * 100) = 100 THEN 99
    ELSE ROUND((1 - (B.Total_amount / (E.International_Price * B.quantity))) * 100)
  END AS discount,
  CONCAT('Pedido Web Internacional Order ID: ', A.id) AS anotation,
  1 AS tax,
  COALESCE(E.International_Description, '') AS item_description
FROM \`JS_Designs.Orders_US\` A
JOIN \`JS_Designs.Order_details_US\` B
  ON A.ID = B.orderId AND DATE(A.date) = DATE(B.dateTime)
LEFT JOIN temp_table C ON A.ID = C.webOrderId_clean
LEFT JOIN \`JS_Designs.Clients\` D
  ON REGEXP_REPLACE(A.client_id, r"^(DIE)", "") = D.document_number
  OR REGEXP_REPLACE(A.client_id, r"^(DIE)", "") = CONCAT(D.document_number, D.dv)
LEFT JOIN \`JS_Designs.Products\` E ON B.SKU = E.sku
WHERE (C.webOrderId_clean IS NULL OR C.webOrderId_clean = '')
  AND A.status IN ('processing')
  AND DATE(A.date) >= '2024-11-01'
  AND A.client_Id NOT LIKE 'null%'
  AND DATE(B.dateTime) > '2024-11-01'
  AND D.id IS NOT NULL
  AND E.product_code IS NOT NULL
  AND CAST(A.id AS STRING) NOT IN ('40691', '40611')

UNION ALL

SELECT
  A.id,
  1 AS quantity,
  IF(A.Client_Id LIKE '%null%', '48762', D.Alegra_id) AS client_code,
  '3727' AS product_code,
  ROUND(A.shipping_total, 2) AS item_price,
  0 AS discount,
  CONCAT('Pedido Web Internacional Order ID: ', A.id) AS anotation,
  1 AS tax,
  'Envío internacional' AS item_description
FROM \`JS_Designs.Orders_US\` A
LEFT JOIN temp_table C ON A.ID = C.webOrderId_clean
LEFT JOIN \`JS_Designs.Clients\` D
  ON REGEXP_REPLACE(A.client_id, r"^(DIE)", "") = D.document_number
  OR REGEXP_REPLACE(A.client_id, r"^(DIE)", "") = CONCAT(D.document_number, D.dv)
WHERE (C.webOrderId_clean IS NULL OR C.webOrderId_clean = '')
  AND A.status IN ('processing')
  AND DATE(A.date) >= '2024-11-01'
  AND A.client_Id NOT LIKE 'null%'
  AND A.shipping_total > 0
  AND D.id IS NOT NULL
  AND CAST(A.id AS STRING) NOT IN ('40691', '40611')
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
    description: String(getVal(row, 'item_description')),
  };
}

export async function queryInvoiceLines(): Promise<InvoiceRow[]> {
  console.log('[Woocommerce US Invoices] Step 1: Ejecutando query en BigQuery...');
  const [rows] = await bigquery.query({ query: QUERY });
  const result = (rows as Record<string, unknown>[]).map(rowToInvoice);
  console.log('[Woocommerce US Invoices] Step 1: Query finalizado. Filas obtenidas:', result.length);
  return result;
}
