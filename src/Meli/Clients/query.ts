/**
 * Query BigQuery para obtener órdenes Meli (JS_Designs.Orders_Meli)
 * que aún no tienen factura ni cliente en JS_Designs.Clients, para crear contactos en Alegra.
 */

import { bigquery } from '../../config/bigquery';

export interface MeliClientRow {
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
  WHERE A.date > '2024-12-01' AND A.status <> 'void'
)
SELECT DISTINCT
  A.Address AS address,
  "contacto@julianasanchez.co" AS email,
  CAST(NULL AS STRING) AS phone,
  INITCAP(A.First_Name) AS firstName,
  INITCAP(A.Last_Name) AS lastName,
  A.document_Number AS documentNumber,
  E.Department AS department,
  E.Alegra_Name AS city,
  A.Document_Type AS documentType,
  IF((CASE WHEN LEFT(A.Document_Type, 2) = 'NI' THEN LEFT(A.Document_Type, 3) ELSE LEFT(A.Document_Type, 2) END) = 'NIT', 'LEGAL_ENTITY', 'PERSON_ENTITY') AS kindOfPerson,
  IF((CASE WHEN LEFT(A.Document_Type, 2) = 'NI' THEN LEFT(A.Document_Type, 3) ELSE LEFT(A.Document_Type, 2) END) = 'NIT', 'COMMON_REGIME', 'SIMPLIFIED_REGIME') AS regime
FROM \`JS_Designs.Orders_Meli\` A
LEFT JOIN temp_table C ON IFNULL(A.Pack_id, A.id) = C.webOrderId
LEFT JOIN \`JS_Designs.Clients\` D ON A.Document_number = D.document_number
LEFT JOIN \`JS_Designs.Source_Cities\` E
  ON IF(SPLIT(A.Code_state, "-")[OFFSET(1)] = "DC", "BOG", SPLIT(A.Code_state, "-")[OFFSET(1)]) = E.ISO_Code
  AND LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(IF(A.State = 'Bogotá D.C.', "Bogota", A.City), r"[áàäâã]", "a"),
            r"[éèëê]", "e"
          ),
          r"[íìïî]", "i"
        ),
        r"[óòöôõ]", "o"
      ),
      r"[úùüû]", "u"
    )
  ) = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(IFNULL(E.Municipality, ''), r"[áàäâã]", "a"),
            r"[éèëê]", "e"
          ),
          r"[íìïî]", "i"
        ),
        r"[óòöôõ]", "o"
      ),
      r"[úùüû]", "u"
    )
  )
WHERE (C.webOrderId IS NULL OR C.webOrderId = "")
  AND D.id IS NULL
`;

/** Lee valor de la fila probando la clave exacta y en minúsculas (BigQuery a veces devuelve nombres en minúscula). */
function getVal(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v != null && v !== '') return String(v).trim();
  const vLower = row[key.toLowerCase()];
  if (vLower != null && vLower !== '') return String(vLower).trim();
  return '';
}

function rowToClient(row: Record<string, unknown>): MeliClientRow {
  return {
    address: getVal(row, 'address'),
    email: getVal(row, 'email') || 'contacto@julianasanchez.co',
    phone: getVal(row, 'phone'),
    firstName: getVal(row, 'firstName'),
    lastName: getVal(row, 'lastName'),
    documentNumber: getVal(row, 'documentNumber'),
    department: getVal(row, 'department'),
    city: getVal(row, 'city'),
    documentType: getVal(row, 'documentType'),
    kindOfPerson: getVal(row, 'kindOfPerson') || 'PERSON_ENTITY',
    regime: getVal(row, 'regime') || 'SIMPLIFIED_REGIME',
  };
}

export async function queryClients(): Promise<MeliClientRow[]> {
  const [rows] = await bigquery.query({ query: QUERY });
  return (rows as Record<string, unknown>[]).map(rowToClient);
}
