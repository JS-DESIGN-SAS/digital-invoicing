# Falabella.com / Invoices

Job que ejecuta el **query de líneas a facturar** (órdenes Falabella sin factura en `JS_Designs.Invoices`), **crea las facturas en Alegra** (una por orden) y **envía el resultado por correo** a **Anthony@julianasanchez.co** en tabla HTML.

- **Tiempo máximo:** 8 minutos.
- **Remitente del correo:** "Sistema de notificaciones JS".
- **Payload Alegra:** sin `seller` (según script original).

## Flujo

1. Query BigQuery: `temp_table` con facturas desde 2025-07-01; `Falabella_Orders` con status shipped/delivered/finished, sin factura, join Clients por NationalID y Products por SKU. `UNION ALL` para línea de envío (product_code 3580, ShippingFeeTotal).
2. Agrupa por orden y crea una factura en Alegra por cada una (POST a `api.alegra.com/api/v1/invoices`). Log por factura: payload y respuesta. Pausa 3 s entre facturas.
3. Construye tabla HTML y envía correo por Gmail SMTP.

## Permisos y configuración

- **BigQuery:** acceso a `JS_Designs` (Invoices, Invoice_Voids, Falabella_Orders, Clients, Products).
- **Secret Manager:** `alegra-token`, `alegra-email` (Alegra); `gmail-smtp-user`, `gmail-smtp-app-password` (correo).

## Uso

- **CLI:** `npm run job:falabellacom:invoices`
- **HTTP:** `POST /jobs/falabellacom/invoices`

## Archivos

- `query.ts`: query BigQuery y mapeo a `InvoiceRow`.
- `alegra.ts`: agrupación por orden, payload (sin seller) y POST a Alegra; log por factura.
- `email.ts`: tabla HTML y envío por Gmail SMTP.
- `index.ts`: `runFalabellaInvoicesJob()` (timeout 8 min).
- `run.ts`: entrada CLI.
