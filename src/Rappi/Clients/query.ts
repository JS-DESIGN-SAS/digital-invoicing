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
  FROM
    \`JS_Designs.Orders_rappi\`
)

SELECT DISTINCT
    user_address,
        user_phone,
        user_email,
        user_id_document,
        "PERSON_ENTITY" as kindOfPerson,
        "Bogotá, D.C." as department,
        "Bogotá, D.C." as city,
        "CC" as documentType,
          -- Primer nombre(s)
  CASE
    WHEN cnt = 1 THEN parts[OFFSET(0)]
    WHEN cnt = 2 THEN parts[OFFSET(0)]
    WHEN cnt = 3 THEN parts[OFFSET(0)]
    WHEN cnt = 4 THEN CONCAT(parts[OFFSET(0)], ' ', parts[OFFSET(1)])
    WHEN cnt = 5 THEN CONCAT(parts[OFFSET(0)], ' ', parts[OFFSET(1)])
    ELSE CONCAT(parts[OFFSET(0)], IF(cnt>5, CONCAT(' +…(', cnt-2, ' apellidos adicionales)'), ''))
  END AS first_name,

  -- Apellidos
  CASE
    WHEN cnt = 1 THEN NULL
    WHEN cnt = 2 THEN parts[OFFSET(1)]
    WHEN cnt = 3 THEN CONCAT(parts[OFFSET(1)], ' ', parts[OFFSET(2)])
    WHEN cnt = 4 THEN CONCAT(parts[OFFSET(2)], ' ', parts[OFFSET(3)])
    WHEN cnt = 5 THEN CONCAT(parts[OFFSET(2)], ' ', parts[OFFSET(3)], ' ', parts[OFFSET(4)])
    ELSE CONCAT(
           parts[OFFSET(2)], ' ',
           parts[OFFSET(3)], ' ',
           parts[OFFSET(4)],
           IF(cnt>5, CONCAT(' +…(', cnt-5, ' apellidos adicionales)'), '')
         )
  END AS last_name,
  "SIMPLIFIED_REGIME" as regime,
  A.created_at as created_at


from \`JS_Designs.Orders_rappi\` A
left join parsed  B
ON A.ORDER_ID = B.ORDER_ID
Left join \`JS_Designs.Clients\` C
ON A.user_id_document = C.document_number

WHERE C.document_number IS NULL and a.user_name not like "%*%"
AND user_id_document IS NOT NULL
AND order_status = 'finished'
AND A.sku <> ""
AND A.sku IS NOT NULL
AND A.user_id_document IS NOT NULL
ORDER BY A.created_at ASC
`;

/** Lee valor de la fila probando la clave exacta y en minúsculas (BigQuery a veces devuelve nombres en minúscula). */
function getVal(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v != null && v !== '') return String(v).trim();
  const vLower = row[key.toLowerCase()];
  if (vLower != null && vLower !== '') return String(vLower).trim();
  return '';
}

function rowToClient(row: Record<string, unknown>): RappiClientRow {
  return {
    user_address: getVal(row, 'user_address'),
    user_phone: getVal(row, 'user_phone'),
    user_email: getVal(row, 'user_email'),
    user_id_document: getVal(row, 'user_id_document'),
    kindOfPerson: getVal(row, 'kindOfPerson') || 'PERSON_ENTITY',
    department: getVal(row, 'department'),
    city: getVal(row, 'city'),
    documentType: getVal(row, 'documentType') || 'CC',
    first_name: getVal(row, 'first_name'),
    last_name: getVal(row, 'last_name'),
    regime: getVal(row, 'regime') || 'SIMPLIFIED_REGIME',
    created_at: getVal(row, 'created_at'),
  };
}

export async function queryClients(): Promise<RappiClientRow[]> {
  const [rows] = await bigquery.query({ query: QUERY });
  return (rows as Record<string, unknown>[]).map(rowToClient);
}
