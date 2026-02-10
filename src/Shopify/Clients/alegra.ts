/**
 * Crear clientes en Alegra a partir de los datos de BigQuery (Shopify).
 */

import { getAlegraSecrets } from '../../config/secrets';
import type { ClientRow } from './query';

const ALEGRA_CONTACTS_URL = 'https://api.alegra.com/api/v1/contacts';

interface AlegraPayload {
  kindOfPerson: string;
  regime: string;
  identificationObject: { number: string; type: string };
  mobile: string;
  email: string;
  type: 'client';
  address?: { address: string; department: string; city: string };
  nameObject?: { firstName: string; lastName: string };
  name?: string;
}

function buildPayload(row: ClientRow): AlegraPayload {
  const name = `${row.firstName} ${row.lastName}`.trim();
  const hasCity = row.city != null && String(row.city).trim() !== '';
  const hasDept = row.department != null && String(row.department).trim() !== '';
  const hasAddr = row.address != null && String(row.address).trim() !== '';
  const address =
    hasCity && hasDept && hasAddr
      ? { address: row.address, department: row.department, city: row.city }
      : undefined;

  const payload: AlegraPayload = {
    kindOfPerson: row.kindOfPerson,
    regime: row.regime,
    identificationObject: { number: row.documentNumber, type: row.documentType },
    mobile: row.phone,
    email: row.email,
    type: 'client',
  };
  if (address) payload.address = address;
  if (row.kindOfPerson === 'PERSON_ENTITY') {
    payload.nameObject = { firstName: row.firstName, lastName: row.lastName };
  } else {
    payload.name = name;
  }
  return payload;
}

export async function createClient(row: ClientRow): Promise<{ ok: boolean; status: number; body: string }> {
  const { token, email } = await getAlegraSecrets();
  const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  const payload = buildPayload(row);

  console.log('[Alegra Client] Datos a cargar:', JSON.stringify(payload));

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
  console.log('[Alegra Client] Respuesta Alegra:', JSON.stringify({ status: res.status, ok: res.ok, body }));
  return { ok: res.ok, status: res.status, body };
}
