/**
 * Query BigQuery para obtener órdenes Falabella (JS_Designs.Falabella_Orders)
 * que aún no tienen cliente en JS_Designs.Clients, para crear contactos en Alegra.
 */

import { bigquery } from '../../config/bigquery';

export interface FalabellaClientRow {
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
    OrderId,
    CustomerName,
    SPLIT(CustomerName, ' ') AS parts,
    ARRAY_LENGTH(SPLIT(CustomerName, ' ')) AS cnt
  FROM \`JS_Designs.Falabella_Orders\`
)
SELECT DISTINCT
  A.Address1 AS user_address,
  A.Phone AS user_phone,
  A.CustomerEmail AS user_email,
  A.NationalID AS user_id_document,
  "PERSON_ENTITY" AS kindOfPerson,
  E.Department AS department,
  E.Alegra_Name AS city,
  "CC" AS documentType,
  CASE
    WHEN B.cnt = 1 THEN B.parts[OFFSET(0)]
    WHEN B.cnt = 2 THEN B.parts[OFFSET(0)]
    WHEN B.cnt = 3 THEN B.parts[OFFSET(0)]
    WHEN B.cnt = 4 THEN CONCAT(B.parts[OFFSET(0)], ' ', B.parts[OFFSET(1)])
    WHEN B.cnt = 5 THEN CONCAT(B.parts[OFFSET(0)], ' ', B.parts[OFFSET(1)])
    ELSE CONCAT(B.parts[OFFSET(0)], IF(B.cnt > 5, CONCAT(' +…(', B.cnt - 2, ' apellidos adicionales)'), ''))
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
      IF(B.cnt > 5, CONCAT(' +…(', B.cnt - 5, ' apellidos adicionales)'), '')
    )
  END AS last_name,
  "SIMPLIFIED_REGIME" AS regime,
  CAST(A.CreatedAt AS STRING) AS created_at
FROM \`JS_Designs.Falabella_Orders\` A
LEFT JOIN parsed B ON A.OrderId = B.OrderId
LEFT JOIN \`JS_Designs.Clients\` C ON A.NationalID = C.document_number
LEFT JOIN \`JS_Designs.Source_Cities\` E
  ON LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              IF(
                LOWER(TRIM(A.City)) IN (
                  "bogotá", "bogota", "bogota d.c.", "bogotá d.c.", "bogota dc", "bogotá dc"
                ),
                "bogota",
                IFNULL(A.City, '')
              ),
              r"[áàäâãÁÀÄÂÃ]", "a"
            ),
            r"[éèëêÉÈËÊ]", "e"
          ),
          r"[íìïîÍÌÏÎ]", "i"
        ),
        r"[óòöôõÓÒÖÔÕ]", "o"
      ),
      r"[úùüûÚÙÜÛ]", "u"
    )
  ) = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              IFNULL(E.Municipality, ''),
              r"[áàäâãÁÀÄÂÃ]", "a"
            ),
            r"[éèëêÉÈËÊ]", "e"
          ),
          r"[íìïîÍÌÏÎ]", "i"
        ),
        r"[óòöôõÓÒÖÔÕ]", "o"
      ),
      r"[úùüûÚÙÜÛ]", "u"
    )
  )
WHERE C.document_number IS NULL
  AND A.NationalID IS NOT NULL
  AND A.SKU IS NOT NULL
  AND TRIM(COALESCE(A.SKU, '')) <> ''
  AND LOWER(A.Status) IN ("shipped", "delivered", "finished")
-- ORDER BY created_at ASC
`;

/** Lee valor de la fila probando la clave exacta y en minúsculas (BigQuery a veces devuelve nombres en minúscula). */
function getVal(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v != null && v !== '') return String(v).trim();
  const vLower = row[key.toLowerCase()];
  if (vLower != null && vLower !== '') return String(vLower).trim();
  return '';
}

function rowToClient(row: Record<string, unknown>): FalabellaClientRow {
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

export async function queryClients(): Promise<FalabellaClientRow[]> {
  const [rows] = await bigquery.query({ query: QUERY });
  return (rows as Record<string, unknown>[]).map(rowToClient);
}
