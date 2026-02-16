/**
 * Rappi / Invoices
 * Query de líneas a facturar (Orders_rappi), creación en Alegra y reporte por email.
 * Tiempo máximo: 8 minutos.
 */

import { queryInvoiceLines } from './query';
import { buildHtmlTable, sendReportEmail } from './email';
import { createInvoicesInAlegra } from './alegra';
import { getGrabilityAccessToken } from './grability';

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

const MAX_DURATION_MS = 8 * 60 * 1000;

async function runJob(): Promise<JobResult> {
  const messages: string[] = [];

  console.log('[Rappi Invoices] Inicio del job.');
  try {
    messages.push('Ejecutando query de facturas Rappi...');
    const rows = await queryInvoiceLines();
    messages.push(`Query devolvió ${rows.length} filas.`);

    if (rows.length === 0) {
      console.log('[Rappi Invoices] No hay líneas. Finalizando sin enviar correo.');
      messages.push('No hay líneas para reportar. No se envía correo.');
      return { total: 0, success: 0, errors: 0, messages };
    }

    messages.push('Obteniendo token Grability para validación de totales...');
    const grabilityToken = await getGrabilityAccessToken();
    messages.push('Token Grability obtenido. Validación con tolerancia 1.000 COP.');

    console.log('[Rappi Invoices] Creando facturas en Alegra (con validación Grability)...');
    const results = await createInvoicesInAlegra(rows, { grabilityToken });
    const created = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    for (const r of results) {
      messages.push(
        r.ok ? `Orden ${r.orderId}: factura creada (status ${r.status})` : `Orden ${r.orderId}: error ${r.status} - ${r.body}`
      );
    }
    messages.push(`Alegra: ${created} facturas creadas, ${failed} errores.`);

    const html = buildHtmlTable(rows);
    const subject = `Rappi Invoices – ${rows.length} líneas, ${created} facturas creadas (${new Date().toISOString().slice(0, 10)})`;
    await sendReportEmail(html, subject);
    messages.push(`Correo enviado a Anthony@julianasanchez.co con tabla de ${rows.length} filas.`);

    console.log('[Rappi Invoices] Job finalizado. Filas:', rows.length, '| Facturas creadas:', created, '| Errores:', failed);
    return { total: rows.length, success: created, errors: failed, messages };
  } catch (err) {
    const msg = String(err);
    console.error('[Rappi Invoices] Error en el job:', msg);
    messages.push('Error: ' + msg);
    return { total: 0, success: 0, errors: 1, messages };
  }
}

export async function runRappiInvoicesJob(): Promise<JobResult> {
  const timeoutPromise = new Promise<JobResult>((_, reject) => {
    setTimeout(() => {
      console.error('[Rappi Invoices] Timeout: tiempo máximo (8 minutos) alcanzado.');
      reject(new Error('Job cancelado: tiempo máximo de ejecución (8 minutos) alcanzado.'));
    }, MAX_DURATION_MS);
  });
  return Promise.race([runJob(), timeoutPromise]);
}
