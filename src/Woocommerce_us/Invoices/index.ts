/**
 * Woocommerce_us / Invoices
 * Query de líneas a facturar (Orders_US + Order_details_US), creación en Alegra (USD, warehouse 32)
 * y reporte por email. Tiempo máximo: 8 minutos.
 */

import { queryInvoiceLines } from './query';
import { getTRM } from './trm';
import { setPrecisionAndCreateInvoices } from './alegra';
import { buildHtmlTable, sendReportEmail } from './email';

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

const MAX_DURATION_MS = 8 * 60 * 1000;

/** En false solo se ejecuta el query y se envía el correo; la facturación en Alegra queda deshabilitada. */
const ENABLE_ALEGRA_INVOICES = false;

async function runJob(): Promise<JobResult> {
  const messages: string[] = [];

  console.log('[Woocommerce US Invoices] Inicio del job.');
  try {
    messages.push('Ejecutando query de facturas Woocommerce US...');
    const rows = await queryInvoiceLines();
    messages.push(`Query devolvió ${rows.length} filas.`);

    let created = 0;
    let failed = 0;

    if (ENABLE_ALEGRA_INVOICES) {
      messages.push('Obteniendo TRM...');
      const trm = await getTRM();
      messages.push(`TRM: ${trm}.`);

      if (rows.length > 0) {
        console.log('[Woocommerce US Invoices] Creando facturas en Alegra (precisión 2, USD, warehouse 32)...');
        const results = await setPrecisionAndCreateInvoices(rows, trm);
        created = results.filter((r) => r.ok).length;
        failed = results.filter((r) => !r.ok).length;
        for (const r of results) {
          messages.push(
            r.ok ? `Orden ${r.orderId}: factura creada (status ${r.status})` : `Orden ${r.orderId}: error ${r.status} - ${r.body}`
          );
        }
        messages.push(`Alegra: ${created} facturas creadas, ${failed} errores.`);
      }
    } else {
      messages.push('Facturación en Alegra deshabilitada (ENABLE_ALEGRA_INVOICES = false). Solo se envía el reporte por correo.');
    }

    if (rows.length === 0) {
      console.log('[Woocommerce US Invoices] No hay líneas. Finalizando sin enviar correo.');
      messages.push('No hay líneas para reportar. No se envía correo.');
      return { total: 0, success: 0, errors: 0, messages };
    }

    const html = buildHtmlTable(rows);
    const subject = ENABLE_ALEGRA_INVOICES
      ? `Woocommerce US Invoices – ${rows.length} líneas, ${created} facturas creadas (${new Date().toISOString().slice(0, 10)})`
      : `Woocommerce US Invoices – ${rows.length} líneas (solo reporte) (${new Date().toISOString().slice(0, 10)})`;
    await sendReportEmail(html, subject);
    messages.push(`Correo enviado a Anthony@julianasanchez.co con tabla de ${rows.length} filas.`);

    console.log('[Woocommerce US Invoices] Job finalizado. Filas:', rows.length, '| Facturas creadas:', created, '| Errores:', failed);
    return { total: rows.length, success: created, errors: failed, messages };
  } catch (err) {
    const msg = String(err);
    console.error('[Woocommerce US Invoices] Error en el job:', msg);
    messages.push('Error: ' + msg);
    return { total: 0, success: 0, errors: 1, messages };
  }
}

export async function runWoocommerceUsInvoicesJob(): Promise<JobResult> {
  const timeoutPromise = new Promise<JobResult>((_, reject) => {
    setTimeout(() => {
      console.error('[Woocommerce US Invoices] Timeout: tiempo máximo (8 minutos) alcanzado.');
      reject(new Error('Job cancelado: tiempo máximo de ejecución (8 minutos) alcanzado.'));
    }, MAX_DURATION_MS);
  });
  return Promise.race([runJob(), timeoutPromise]);
}
