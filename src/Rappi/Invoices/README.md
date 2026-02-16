# Rappi / Invoices

Job para generar **facturas** desde Rappi: query a BigQuery (Orders_rappi, sin factura en JS_Designs.Invoices), creación en Alegra (warehouse 1, COP) y reporte por email.

## Flujo

1. Ejecutar query: órdenes Rappi con `order_status = 'finished'`, fecha ≥ 2025-01-01, con cliente en Clients (un Alegra_id por document_number) y producto con precio; excluye órdenes ya facturadas (F.webOrderId IS NULL).
2. Obtener token Grability (login con client_id/client_secret).
3. Por cada orden: GET Grability `orders/{order_id}` para obtener `total_with_discount`; comparar con el total a cargar en Alegra `(price*1.19)*(1 - discount/100)` por ítem. Si la diferencia es mayor a 1.000 COP no se crea la factura y se registra error.
4. Crear facturas en Alegra (warehouse 1, sin seller, tax 3) para órdenes que pasan la validación.
5. Enviar correo con tabla HTML a Anthony@julianasanchez.co.

Timeout del job: 8 minutos. Pausa de 3 s entre facturas.

## Uso

- **CLI:** `npm run job:rappi:invoices`
- **HTTP:** `POST /jobs/rappi/invoices`

## Secretos / variables

- Alegra: `alegra-token`, `alegra-email` (o `ALEGRA_TOKEN`, `ALEGRA_EMAIL`).
- Grability (Rappi): `rappi-grability-client-id`, `rappi-grability-client-secret` (o `RAPPI_GRABILITY_CLIENT_ID`, `RAPPI_GRABILITY_CLIENT_SECRET`).
- Correo: `gmail-smtp-user`, `gmail-smtp-app-password` (o `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`).
- BigQuery: proyecto y credenciales según `src/config/bigquery`.
