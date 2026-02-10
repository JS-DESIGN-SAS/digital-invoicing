# Shopify / Clients

Job que obtiene órdenes de **BigQuery** (dataset `JS_Designs`: `Orders`, `Invoices`, `Clients`, `Source_Cities`) que aún no tienen factura ni cliente registrado, y crea los **contactos (clientes)** en **Alegra**.

## Lógica

1. **Query BigQuery**: órdenes con `status IN ('processing','addi-approved','PAID')`, con fecha desde 2024-09-01, que no estén en `JS_Designs.Invoices` (sin factura) y cuyo `client_Id` no exista en `JS_Designs.Clients`. Se hace join con `Source_Cities` para department y ciudad (Alegra_Name).
2. Por cada fila se arma el payload de Alegra (tipo de persona, régimen, identificación, dirección si hay ciudad/departamento/dirección, nombre o nameObject).
3. **POST** a `https://api.alegra.com/api/v1/contacts` con autenticación Basic + header `Alegra-Authorization: Bearer <token>`.
4. Entre cada creación se espera 5 segundos para no saturar la API.

## Uso

### CLI

```bash
npm run job:shopify:clients
```

Requiere `ALEGRA_EMAIL`, `ALEGRA_TOKEN` y credenciales GCP (BigQuery) configuradas.

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/shopify/clients
```

## Configuración

| Origen | Variable / Secreto | Descripción |
|--------|---------------------|-------------|
| Env o Secret Manager | `ALEGRA_EMAIL` / `alegra-email` | Email Alegra |
| Env o Secret Manager | `ALEGRA_TOKEN` / `alegra-token` | Token API Alegra |
| GCP | Service account / ADC | Acceso a BigQuery y Secret Manager |

El **project ID** de BigQuery se toma de `GOOGLE_CLOUD_PROJECT` o `GCP_PROJECT`; si no está definido, se usa `js-design-416617` por defecto.

## Archivos

- `query.ts`: query BigQuery y mapeo a `ClientRow`.
- `alegra.ts`: construcción del payload y `createClient()` (POST a Alegra).
- `index.ts`: `runShopifyClientsJob()` usado por el servidor HTTP.
- `run.ts`: entrada CLI del job.
