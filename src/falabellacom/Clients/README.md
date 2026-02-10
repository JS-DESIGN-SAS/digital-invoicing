# Falabella.com / Clients

Job que obtiene órdenes de **BigQuery** (tabla `JS_Designs.Falabella_Orders`) que aún no tienen cliente en `JS_Designs.Clients`, y crea los **contactos (clientes)** en **Alegra**.

## Lógica

1. **Query BigQuery**: órdenes con `Status` en shipped/delivered/finished, con `SKU` no vacío, `NationalID` no nulo, que no existan en `JS_Designs.Clients` (por `document_number`). Se usa un CTE para partir `CustomerName` en nombre y apellidos. Department y city vienen del join con `JS_Designs.Source_Cities` (normalizando acentos y variantes de Bogotá).
2. Por cada fila se arma el payload de Alegra (siempre con `address`) y se envía **POST** a `https://api.alegra.com/api/v1/contacts`.
3. Entre cada creación se espera 5 segundos.

## Uso

### CLI

```bash
npm run job:falabellacom:clients
```

Requiere `ALEGRA_EMAIL`, `ALEGRA_TOKEN` y credenciales GCP (BigQuery) configuradas.

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/falabellacom/clients
```

## Configuración

| Origen | Variable / Secreto | Descripción |
|--------|--------------------|-------------|
| Env o Secret Manager | `ALEGRA_EMAIL` / `alegra-email` | Email Alegra |
| Env o Secret Manager | `ALEGRA_TOKEN` / `alegra-token` | Token API Alegra |
| GCP | Service account / ADC | Acceso a BigQuery y Secret Manager |

## Archivos

- `query.ts`: query BigQuery y mapeo a `FalabellaClientRow` (con lectura por clave exacta y en minúsculas).
- `alegra.ts`: construcción del payload y `createClient()` (POST a Alegra).
- `index.ts`: `runFalabellaClientsJob()` usado por el servidor HTTP.
- `run.ts`: entrada CLI del job.
