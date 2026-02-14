/**
 * Shopify / Invoices
 * Ejecuta el query de líneas a facturar y envía el resultado por correo en tabla HTML.
 * Por ahora no crea facturas en Alegra; solo reporte por email.
 * Tiempo máximo de ejecución: 8 minutos.
 */

import { queryInvoiceLines } from './query';
import { buildHtmlTable, sendReportEmail } from './email';

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

    const html = buildHtmlTable(rows);
    const subject = `Shopify Invoices – ${rows.length} líneas (${new Date().toISOString().slice(0, 10)})`;
    await sendReportEmail(html, subject);
    messages.push(`Correo enviado a Anthony@julianasanchez.co con tabla de ${rows.length} filas.`);

    console.log('[Shopify Invoices] Job finalizado correctamente. Total filas:', rows.length);
    return {
      total: rows.length,
      success: rows.length,
      errors: 0,
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
