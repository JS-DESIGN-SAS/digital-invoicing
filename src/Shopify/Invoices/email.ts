/**
 * Construye HTML en tabla con el resultado del query de facturas
 * y envía el correo usando Gmail SMTP (credenciales en Secret Manager).
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
  const headers = [
    'Order ID',
    'Quantity',
    'Client code',
    'Product code',
    'Item price',
    'Discount',
    'Annotation',
    'Tax',
  ];
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map(
      (r) =>
        `<tr>` +
        [
          r.id,
          r.quantity,
          r.client_code,
          r.product_code,
          r.item_price,
          r.discount,
          r.anotation,
          r.tax,
        ]
          .map((c) => `<td>${escapeHtml(String(c))}</td>`)
          .join('') +
        `</tr>`
    )
    .join('');

  return `
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
  <h2>Shopify Invoices – Resultado del query</h2>
  <p>Total de filas: <strong>${rows.length}</strong></p>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <p><small>Generado por digital-invoicing (Shopify/Invoices job)</small></p>
</body>
</html>`.trim();
}

export async function sendReportEmail(html: string, subject: string): Promise<void> {
  const { user, appPassword } = await getEmailSecrets();
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user,
      pass: appPassword,
    },
  });
  await transporter.sendMail({
    from: user,
    to: TO_EMAIL,
    subject,
    html,
  });
}
