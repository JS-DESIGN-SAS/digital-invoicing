/**
 * Query BigQuery para obtener órdenes WooCommerce US (JS_Designs.Orders_US)
 * que aún no tienen factura ni cliente en JS_Designs.Clients, para crear contactos en Alegra.
 */

import { bigquery } from '../../config/bigquery';

export interface WoocommerceUsClientRow {
  orderId: string;
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
  A.id AS orderId,
  CONCAT(A.address_1, " ", IFNULL(A.address_2, "")) AS address,
  A.Email AS email,
  A.Phone AS phone,
  INITCAP(A.First_Name) AS firstName,
  INITCAP(A.Last_Name) AS lastName,
  REGEXP_REPLACE(A.client_Id, r"^(DIE)", "") AS documentNumber,
  NULL AS department,
  A.city AS city,
  "DIE" AS documentType,
  "PERSON_ENTITY" AS kindOfPerson,
  "SIMPLIFIED_REGIME" AS regime
FROM \`JS_Designs.Orders_US\` A
LEFT JOIN temp_table C ON A.id = C.webOrderId
LEFT JOIN \`JS_Designs.Clients\` D ON A.client_Id = D.id
WHERE (C.webOrderId IS NULL OR C.webOrderId = "")
  AND A.status IN ('processing', 'addi-approved')
  AND DATE(A.date) >= '2024-09-01'
  AND DATE(A.date) > '2024-07-01'
  AND D.id IS NULL
  AND CAST(A.id AS STRING) <> "40611"
`;

/** Lee valor de la fila probando la clave exacta y en minúsculas (BigQuery a veces devuelve nombres en minúscula). */
function getVal(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v != null && v !== '') return String(v).trim();
  const vLower = row[key.toLowerCase()];
  if (vLower != null && vLower !== '') return String(vLower).trim();
  return '';
}

function rowToClient(row: Record<string, unknown>): WoocommerceUsClientRow {
  return {
    orderId: getVal(row, 'orderId'),
    address: getVal(row, 'address'),
    email: getVal(row, 'email'),
    phone: getVal(row, 'phone'),
    firstName: getVal(row, 'firstName'),
    lastName: getVal(row, 'lastName'),
    documentNumber: getVal(row, 'documentNumber'),
    department: getVal(row, 'department') ?? '',
    city: getVal(row, 'city'),
    documentType: getVal(row, 'documentType') || 'DIE',
    kindOfPerson: getVal(row, 'kindOfPerson') || 'PERSON_ENTITY',
    regime: getVal(row, 'regime') || 'SIMPLIFIED_REGIME',
  };
}

export async function queryClients(): Promise<WoocommerceUsClientRow[]> {
  const [rows] = await bigquery.query({ query: QUERY });
  return (rows as Record<string, unknown>[]).map(rowToClient);
}
