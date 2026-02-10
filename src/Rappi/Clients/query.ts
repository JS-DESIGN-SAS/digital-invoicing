/**
 * Query BigQuery para obtener órdenes Rappi (JS_Designs.Orders_rappi)
 * que aún no tienen cliente en JS_Designs.Clients, para crear contactos en Alegra.
 */

import { bigquery } from '../../config/bigquery';

export interface RappiClientRow {
  user_address: string;
  user_phone: string;
  user_email: string;
  user_id_document: string;
  kindOfPerson: string;
  department: string;
  city: string;
  documentType: string;
  first_name: string;
  last_name: string;
  regime: string;
  created_at: string;
}

const QUERY = `
WITH parsed AS (
  SELECT
    Order_id,
    user_name,
    SPLIT(user_name, ' ')                        AS parts,
    ARRAY_LENGTH(SPLIT(user_name, ' '))           AS cnt
  FROM \`JS_Designs.Orders_rappi\`
)
SELECT DISTINCT
  A.user_address    AS user_address,
  A.user_phone      AS user_phone,
  A.user_email      AS user_email,
  A.user_id_document AS user_id_document,
  "PERSON_ENTITY"   AS kindOfPerson,
  "Bogotá, D.C."    AS department,
  "Bogotá, D.C."    AS city,
  "CC"              AS documentType,
  CASE
    WHEN B.cnt = 1 THEN B.parts[OFFSET(0)]
    WHEN B.cnt = 2 THEN B.parts[OFFSET(0)]
    WHEN B.cnt = 3 THEN B.parts[OFFSET(0)]
    WHEN B.cnt = 4 THEN CONCAT(B.parts[OFFSET(0)], ' ', B.parts[OFFSET(1)])
    WHEN B.cnt = 5 THEN CONCAT(B.parts[OFFSET(0)], ' ', B.parts[OFFSET(1)])
    ELSE CONCAT(B.parts[OFFSET(0)], IF(B.cnt>5, CONCAT(' +…(', B.cnt-2, ' apellidos adicionales)'), ''))
  END AS first_name,
  CASE
    WHEN B.cnt = 1 THEN NULL
    WHEN B.cnt = 2 THEN B.parts[OFFSET(1)]
    WHEN B.cnt = 3 THEN CONCAT(B.parts[OFFSET(1)], ' ', B.parts[OFFSET(2)])
    WHEN B.cnt = 4 THEN CONCAT(B.parts[OFFSET(2)], ' ', B.parts[OFFSET(3)])
    WHEN B.cnt = 5 THEN CONCAT(B.parts[OFFSET(2)], ' ', B.parts[OFFSET(3)], ' ', B.parts[OFFSET(4)])
    ELSE CONCAT(
      B.parts[OFFSET(2)], ' ',
      B.parts[OFFSET(3)], ' ',
      B.parts[OFFSET(4)],
      IF(B.cnt>5, CONCAT(' +…(', B.cnt-5, ' apellidos adicionales)'), '')
    )
  END AS last_name,
  "SIMPLIFIED_REGIME" AS regime,
  CAST(A.created_at AS STRING) AS created_at
FROM \`JS_Designs.Orders_rappi\` A
LEFT JOIN parsed B ON A.Order_id = B.Order_id
LEFT JOIN \`JS_Designs.Clients\` C ON A.user_id_document = C.document_number
WHERE C.document_number IS NULL
  AND A.user_name NOT LIKE '%*%'
  AND A.user_id_document IS NOT NULL
  AND A.order_status = 'finished'
  AND A.sku IS NOT NULL
  AND TRIM(COALESCE(A.sku, '')) <> ''
ORDER BY A.created_at ASC
`;

function rowToClient(row: Record<string, unknown>): RappiClientRow {
  const get = (key: string): string => (row[key] != null ? String(row[key]) : '');
  return {
    user_address: get('user_address'),
    user_phone: get('user_phone'),
    user_email: get('user_email'),
    user_id_document: get('user_id_document'),
    kindOfPerson: get('kindOfPerson'),
    department: get('department'),
    city: get('city'),
    documentType: get('documentType'),
    first_name: get('first_name'),
    last_name: get('last_name'),
    regime: get('regime'),
    created_at: get('created_at'),
  };
}

export async function queryClients(): Promise<RappiClientRow[]> {
  const [rows] = await bigquery.query({ query: QUERY });
  return (rows as Record<string, unknown>[]).map(rowToClient);
}
