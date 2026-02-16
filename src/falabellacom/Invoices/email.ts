/**
 * Tabla HTML y envío de correo para reporte Falabella Invoices.
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
  console.log('[Falabella Invoices] Step 2: Construyendo tabla HTML con', rows.length, 'filas...');
  const headers = ['Order ID', 'Quantity', 'Client code', 'Product code', 'Item price', 'Discount', 'Annotation', 'Tax'];
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map(
      (r) =>
        `<tr>` +
        [r.id, r.quantity, r.client_code, r.product_code, r.item_price, r.discount, r.anotation, r.tax]
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
  <h2>Falabella Invoices – Resultado del query</h2>
  <p>Total de filas: <strong>${rows.length}</strong></p>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <p><small>Generado por digital-invoicing (Falabella/Invoices job)</small></p>
</body>
</html>`.trim();
  console.log('[Falabella Invoices] Step 2: Tabla HTML generada.');
  return html;
}

export async function sendReportEmail(html: string, subject: string): Promise<void> {
  console.log('[Falabella Invoices] Step 3: Obteniendo credenciales de correo...');
  const { user, appPassword } = await getEmailSecrets();
  console.log('[Falabella Invoices] Step 3: Enviando correo a', TO_EMAIL, '...');
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
  console.log('[Falabella Invoices] Step 3: Correo enviado correctamente a', TO_EMAIL);
}
