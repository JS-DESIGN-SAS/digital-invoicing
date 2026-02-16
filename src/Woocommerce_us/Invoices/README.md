# Woocommerce_us / Invoices

Job para generar **facturas** desde WooCommerce US: query a BigQuery (Orders_US + Order_details_US, excluyendo órdenes ya facturadas en store 32), creación en Alegra en USD (warehouse 32, document type 3, TRM desde datos.gov.co) y reporte por email.

## Flujo

1. Obtener TRM (datos.gov.co).
2. Ejecutar query: líneas de productos + envío internacional (product 3727); excluye órdenes ya en `JS_Designs.Invoices` (store_id 32) y órdenes 40691, 40611.
3. Actualizar precisión decimal de la empresa en Alegra a 2.
4. Crear facturas en Alegra (USD, `exchangeRate` TRM, ítems con descripción, reintentos ante 5xx, `X-Request-Key: invoice-us-{orderId}`).
5. Restaurar precisión decimal a 0.
6. Enviar correo con tabla HTML a Anthony@julianasanchez.co.

Timeout del job: 8 minutos.

## Uso

- **CLI:** `npm run job:woocommerce_us:invoices`
- **HTTP:** `POST /jobs/woocommerce_us/invoices`

## Secretos / variables

- Alegra: `alegra-token`, `alegra-email` (o `ALEGRA_TOKEN`, `ALEGRA_EMAIL`).
- Correo: `gmail-smtp-user`, `gmail-smtp-app-password` (o `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`).
- BigQuery: proyecto y credenciales según `src/config/bigquery`.
