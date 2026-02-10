/**
 * Crear clientes en Alegra a partir de los datos de BigQuery (Falabella).
 */

import { getAlegraSecrets } from '../../config/secrets';
import type { FalabellaClientRow } from './query';

const ALEGRA_CONTACTS_URL = 'https://api.alegra.com/api/v1/contacts';

interface AlegraPayload {
  kindOfPerson: string;
  regime: string;
  identificationObject: { number: string; type: string };
  address: { address: string; department: string; city: string };
  mobile: string;
  email: string;
  type: 'client';
  nameObject?: { firstName: string; lastName: string };
  name?: string;
}

function buildPayload(row: FalabellaClientRow): AlegraPayload {
  const firstName = row.first_name ?? '';
  const lastName = row.last_name ?? '';
  const name = `${firstName} ${lastName}`.trim();

  const payload: AlegraPayload = {
    kindOfPerson: row.kindOfPerson || 'PERSON_ENTITY',
    regime: row.regime || 'SIMPLIFIED_REGIME',
    identificationObject: {
      number: row.user_id_document,
      type: row.documentType || 'CC',
    },
    address: {
      address: row.user_address,
      department: row.department ?? '',
      city: row.city ?? '',
    },
    mobile: row.user_phone,
    email: row.user_email,
    type: 'client',
  };

  if (payload.kindOfPerson === 'PERSON_ENTITY') {
    payload.nameObject = { firstName, lastName };
  } else {
    payload.name = name;
  }
  return payload;
}

export async function createClient(row: FalabellaClientRow): Promise<{ ok: boolean; status: number; body: string }> {
  const { token, email } = await getAlegraSecrets();
  const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  const payload = buildPayload(row);

  console.log('[Alegra Client Falabella] Datos a cargar:', JSON.stringify(payload));

  const res = await fetch(ALEGRA_CONTACTS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader,
      'Alegra-Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  console.log('[Alegra Client Falabella] Respuesta Alegra:', JSON.stringify({ status: res.status, ok: res.ok, body }));
  return { ok: res.ok, status: res.status, body };
}
