/**
 * Query BigQuery para obtener órdenes de Shopify (JS_Designs) que aún no tienen factura
 * y no están en Clients, para crear contactos en Alegra.
 */

import { bigquery } from '../../config/bigquery';

export interface ClientRow {
  address: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  department: string;
  city: string;
  documentType: string;
  kindOfPerson: string;
  regime: string;
}

const QUERY = `
WITH temp_table AS (
  SELECT *
  FROM \`JS_Designs.Invoices\` A
  WHERE A.date > '2024-08-01' AND A.status <> 'void'
)
SELECT
  CONCAT(A.address_1, " ", A.address_2) AS address,
  A.Email AS email,
  A.phone AS phone,
  INITCAP(A.First_Name) AS First_Name,
  INITCAP(A.Last_Name) AS Last_Name,
  REGEXP_REPLACE(
    REGEXP_REPLACE(A.Client_id, r"^(CC|CE|PP|NIT|TE|TI)", ""),
    r"[.,;-]",
    ""
  ) AS document_Number,
  E.Department AS Department,
  E.Alegra_Name AS city,
  CASE WHEN LEFT(A.Client_id, 2) = 'NI' THEN LEFT(A.Client_id, 3) ELSE LEFT(A.Client_id, 2) END AS Document_Type,
  IF((CASE WHEN LEFT(A.Client_id, 2) = 'NI' THEN LEFT(A.Client_id, 3) ELSE LEFT(A.Client_id, 2) END) = 'NIT', 'LEGAL_ENTITY', 'PERSON_ENTITY') AS kindOfPerson,
  IF((CASE WHEN LEFT(A.Client_id, 2) = 'NI' THEN LEFT(A.Client_id, 3) ELSE LEFT(A.Client_id, 2) END) = 'NIT', 'COMMON_REGIME', 'SIMPLIFIED_REGIME') AS regime
FROM \`JS_Designs.Orders\` A
LEFT JOIN temp_table C ON A.ID = C.webOrderId
LEFT JOIN \`JS_Designs.Clients\` D ON A.client_Id = D.id
LEFT JOIN \`JS_Designs.Source_Cities\` E
  ON REPLACE(A.Department, ",", "") = REPLACE(E.Department, ",", "")
  AND LOWER(
    REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(LOWER(A.city), r"[áàäâã]", "a"), r"[éèëê]", "e"), r"[íìïî]", "i"), r"[óòöôõ]", "o"), r"[úùüû]", "u")
  ) = LOWER(
    REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(LOWER(E.Municipality), r"[áàäâã]", "a"), r"[éèëê]", "e"), r"[íìïî]", "i"), r"[óòöôõ]", "o"), r"[úùüû]", "u")
  )
WHERE (C.webOrderId IS NULL OR C.webOrderId = "")
  AND A.status IN ('processing', 'addi-approved', 'PAID')
  AND DATE(A.date) >= '2024-09-01'
  AND DATE(A.date) > '2024-07-01'
  AND D.id IS NULL
`;

function rowToClient(row: Record<string, unknown>): ClientRow {
  const get = (key: string): string => (row[key] != null ? String(row[key]) : '');
  return {
    address: get('address'),
    email: get('email'),
    phone: get('phone'),
    firstName: get('First_Name'),
    lastName: get('Last_Name'),
    documentNumber: get('document_Number'),
    department: get('Department'),
    city: get('city'),
    documentType: get('Document_Type'),
    kindOfPerson: get('kindOfPerson'),
    regime: get('regime'),
  };
}

export async function queryClients(): Promise<ClientRow[]> {
  const [rows] = await bigquery.query({ query: QUERY });
  return (rows as Record<string, unknown>[]).map(rowToClient);
}
