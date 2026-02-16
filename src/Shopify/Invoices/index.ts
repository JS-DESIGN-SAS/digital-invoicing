/**
 * Shopify / Invoices
 * Ejecuta el query de líneas a facturar, crea las facturas en Alegra y envía el resultado por correo.
 * Tiempo máximo de ejecución: 8 minutos.
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

const MAX_DURATION_MS = 8 * 60 * 1000; // 8 minutos
async function runJob(): Promise<JobResult> {
  const messages: string[] = [];

  console.log('[Shopify Invoices] Inicio del job.');
  try {
    messages.push('Ejecutando query de facturas Shopify...');
    const rows = await queryInvoiceLines();
    messages.push(`Query devolvió ${rows.length} filas.`);

    if (rows.length === 0) {
      console.log('[Shopify Invoices] No hay líneas para reportar. Finalizando sin enviar correo.');
      messages.push('No hay líneas para reportar. No se envía correo.');
      return {
        total: 0,
        success: 0,
        errors: 0,
        messages,
      };
    }

    console.log('[Shopify Invoices] Creando facturas en Alegra...');
    const results = await createInvoicesInAlegra(rows);
    const created = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    for (const r of results) {
      messages.push(
        r.ok
          ? `Orden ${r.orderId}: factura creada (status ${r.status})`
          : `Orden ${r.orderId}: error ${r.status} - ${r.body}`
      );
    }
    messages.push(`Alegra: ${created} facturas creadas, ${failed} errores.`);

    const html = buildHtmlTable(rows);
    const subject = `Shopify Invoices – ${rows.length} líneas, ${created} facturas creadas (${new Date().toISOString().slice(0, 10)})`;
    await sendReportEmail(html, subject);
    messages.push(`Correo enviado a Anthony@julianasanchez.co con tabla de ${rows.length} filas.`);

    console.log('[Shopify Invoices] Job finalizado. Filas:', rows.length, '| Facturas creadas:', created, '| Errores:', failed);
    return {
      total: rows.length,
      success: created,
      errors: failed,
      messages,
    };
  } catch (err) {
    const msg = String(err);
    console.error('[Shopify Invoices] Error en el job:', msg);
    messages.push('Error: ' + msg);
    return {
      total: 0,
      success: 0,
      errors: 1,
      messages,
    };
  }
}

export async function runShopifyInvoicesJob(): Promise<JobResult> {
  const timeoutPromise = new Promise<JobResult>((_, reject) => {
    setTimeout(() => {
      console.error('[Shopify Invoices] Timeout: tiempo máximo de ejecución (8 minutos) alcanzado.');
      reject(new Error('Job cancelado: tiempo máximo de ejecución (8 minutos) alcanzado.'));
    }, MAX_DURATION_MS);
  });
  return Promise.race([runJob(), timeoutPromise]);
}
