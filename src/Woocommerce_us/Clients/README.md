# Woocommerce_us / Clients

Job que obtiene órdenes de **BigQuery** (tabla `JS_Designs.Orders_US`) que aún no tienen factura ni cliente en `JS_Designs.Clients`, y crea los **contactos (clientes)** en **Alegra**. Usa documento tipo **DIE** (USA).

## Lógica

1. **Query BigQuery**: órdenes con `status` en processing/addi-approved, fecha desde 2024-09-01, sin factura en `JS_Designs.Invoices` y sin cliente en `JS_Designs.Clients` (por `client_Id` = D.id). Se excluye la orden id 40611. Documento: se quita el prefijo "DIE" del `client_Id` para `documentNumber`; tipo fijo "DIE", persona natural, régimen simplificado. Department NULL; city desde A.city.
2. Por cada fila se arma el payload de Alegra (siempre con `address`) y se envía **POST** a `https://api.alegra.com/api/v1/contacts`.
3. Entre cada creación se espera 5 segundos.

## Uso

### CLI

```bash
npm run job:woocommerce_us:clients
```

Requiere `ALEGRA_EMAIL`, `ALEGRA_TOKEN` y credenciales GCP (BigQuery).

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/woocommerce_us/clients
```

## Configuración

| Origen | Variable / Secreto | Descripción |
|--------|--------------------|-------------|
| Env o Secret Manager | `ALEGRA_EMAIL` / `alegra-email` | Email Alegra |
| Env o Secret Manager | `ALEGRA_TOKEN` / `alegra-token` | Token API Alegra |
| GCP | Service account / ADC | Acceso a BigQuery y Secret Manager |

## Archivos

- `query.ts`: query BigQuery y mapeo a `WoocommerceUsClientRow`.
- `alegra.ts`: construcción del payload y `createClient()` (POST a Alegra, tipo DIE).
- `index.ts`: `runWoocommerceUsClientsJob()`.
- `run.ts`: entrada CLI.
