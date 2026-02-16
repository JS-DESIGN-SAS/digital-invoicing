/**
 * Tabla HTML y envío de correo para reporte Woocommerce US Invoices.
 */

import nodemailer from 'nodemailer';
import { getEmailSecrets } from '../../config/secrets';
import type { InvoiceRow } from './query';

const TO_EMAIL = 'Anthony@julianasanchez.co';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHtmlTable(rows: InvoiceRow[]): string {
  console.log('[Woocommerce US Invoices] Construyendo tabla HTML con', rows.length, 'filas...');
  const headers = [
    'Order ID',
    'Quantity',
    'Client code',
    'Product code',
    'Item price',
    'Discount',
    'Annotation',
    'Tax',
    'Description',
  ];
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map(
      (r) =>
        `<tr>` +
        [r.id, r.quantity, r.client_code, r.product_code, r.item_price, r.discount, r.anotation, r.tax, r.description]
          .map((c) => `<td>${escapeHtml(String(c))}</td>`)
          .join('') +
        `</tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #333; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h2>Woocommerce US Invoices – Resultado del query</h2>
  <p>Total de filas: <strong>${rows.length}</strong></p>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <p><small>Generado por digital-invoicing (Woocommerce US/Invoices job)</small></p>
</body>
</html>`.trim();
  return html;
}

export async function sendReportEmail(html: string, subject: string): Promise<void> {
  console.log('[Woocommerce US Invoices] Obteniendo credenciales de correo...');
  const { user, appPassword } = await getEmailSecrets();
  console.log('[Woocommerce US Invoices] Enviando correo a', TO_EMAIL, '...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass: appPassword },
  });
  const fromDisplay = '"Sistema de notificaciones JS" <' + user + '>';
  await transporter.sendMail({
    from: fromDisplay,
    to: TO_EMAIL,
    subject,
    html,
  });
  console.log('[Woocommerce US Invoices] Correo enviado correctamente a', TO_EMAIL);
}
