/**
 * Falabella.com / Invoices
 * Query de líneas a facturar, creación en Alegra y reporte por email.
 * Tiempo máximo: 8 minutos.
 */

import { queryInvoiceLines } from './query';
import { buildHtmlTable, sendReportEmail } from './email';
import { createInvoicesInAlegra } from './alegra';

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

const MAX_DURATION_MS = 8 * 60 * 1000;

async function runJob(): Promise<JobResult> {
  const messages: string[] = [];

  console.log('[Falabella Invoices] Inicio del job.');
  try {
    messages.push('Ejecutando query de facturas Falabella...');
    const rows = await queryInvoiceLines();
    messages.push(`Query devolvió ${rows.length} filas.`);

    if (rows.length === 0) {
      console.log('[Falabella Invoices] No hay líneas. Finalizando sin enviar correo.');
      messages.push('No hay líneas para reportar. No se envía correo.');
      return { total: 0, success: 0, errors: 0, messages };
    }

    console.log('[Falabella Invoices] Creando facturas en Alegra...');
    const results = await createInvoicesInAlegra(rows);
    const created = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    for (const r of results) {
      messages.push(
        r.ok ? `Orden ${r.orderId}: factura creada (status ${r.status})` : `Orden ${r.orderId}: error ${r.status} - ${r.body}`
      );
    }
    messages.push(`Alegra: ${created} facturas creadas, ${failed} errores.`);

    const html = buildHtmlTable(rows);
    const subject = `Falabella Invoices – ${rows.length} líneas, ${created} facturas creadas (${new Date().toISOString().slice(0, 10)})`;
    await sendReportEmail(html, subject);
    messages.push(`Correo enviado a Anthony@julianasanchez.co con tabla de ${rows.length} filas.`);

    console.log('[Falabella Invoices] Job finalizado. Filas:', rows.length, '| Facturas creadas:', created, '| Errores:', failed);
    return { total: rows.length, success: created, errors: failed, messages };
  } catch (err) {
    const msg = String(err);
    console.error('[Falabella Invoices] Error en el job:', msg);
    messages.push('Error: ' + msg);
    return { total: 0, success: 0, errors: 1, messages };
  }
}

export async function runFalabellaInvoicesJob(): Promise<JobResult> {
  const timeoutPromise = new Promise<JobResult>((_, reject) => {
    setTimeout(() => {
      console.error('[Falabella Invoices] Timeout: tiempo máximo (8 minutos) alcanzado.');
      reject(new Error('Job cancelado: tiempo máximo de ejecución (8 minutos) alcanzado.'));
    }, MAX_DURATION_MS);
  });
  return Promise.race([runJob(), timeoutPromise]);
}
