# Rappi / Clients

Job que obtiene órdenes de **BigQuery** (tabla `JS_Designs.Orders_rappi`) que aún no tienen cliente en `JS_Designs.Clients`, y crea los **contactos (clientes)** en **Alegra**.

## Lógica

1. **Query BigQuery**: órdenes con `order_status = 'finished'`, con `sku` no vacío, `user_id_document` no nulo, `user_name` sin `*`, que no existan en `JS_Designs.Clients` (por `document_number`). Se usa un CTE para partir `user_name` en nombre(s) y apellido(s). Department y city se fijan en "Bogotá, D.C.", tipo documento CC, persona natural y régimen simplificado.
2. Por cada fila se arma el payload de Alegra (siempre con `address`) y se envía **POST** a `https://api.alegra.com/api/v1/contacts`.
3. Entre cada creación se espera 5 segundos.

## Uso

### CLI

```bash
npm run job:rappi:clients
```

Requiere `ALEGRA_EMAIL`, `ALEGRA_TOKEN` y credenciales GCP (BigQuery) configuradas.

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/rappi/clients
```

## Configuración

| Origen | Variable / Secreto | Descripción |
|--------|--------------------|-------------|
| Env o Secret Manager | `ALEGRA_EMAIL` / `alegra-email` | Email Alegra |
| Env o Secret Manager | `ALEGRA_TOKEN` / `alegra-token` | Token API Alegra |
| GCP | Service account / ADC | Acceso a BigQuery y Secret Manager |

## Archivos

- `query.ts`: query BigQuery y mapeo a `RappiClientRow`.
- `alegra.ts`: construcción del payload y `createClient()` (POST a Alegra).
- `index.ts`: `runRappiClientsJob()` usado por el servidor HTTP.
- `run.ts`: entrada CLI del job.
