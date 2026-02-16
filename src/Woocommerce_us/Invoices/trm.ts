/**
 * Obtiene la TRM (tasa representativa del mercado) desde datos.gov.co para facturación USD.
 */

const TRM_URL =
  'https://www.datos.gov.co/resource/ceyp-9c7c.json?$limit=1&$order=vigenciadesde%20DESC';

export async function getTRM(): Promise<number> {
  const res = await fetch(TRM_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`TRM request failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { valor: string }[];
  if (!data?.length || data[0].valor == null) {
    throw new Error('No se pudo obtener la TRM desde datos.gov.co');
  }
  const valor = parseFloat(String(data[0].valor));
  if (Number.isNaN(valor) || valor <= 0) {
    throw new Error('TRM inválida: ' + data[0].valor);
  }
  return valor;
}
