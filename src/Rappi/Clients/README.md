# Rappi / Clients

Job para crear **clientes** a partir de datos de Rappi (ej. BigQuery o API Rappi). Actualmente es un **placeholder**: devuelve total/created/errors en 0 y el mensaje "Job Rappi/Clients no implementado aún."

## Uso

### CLI

```bash
npm run job:rappi:clients
```

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/rappi/clients
```

## Próximos pasos

- Definir fuente de datos (BigQuery, API Rappi, etc.).
- Reutilizar o adaptar la creación de contactos en Alegra (similar a Shopify/Clients) si aplica.
- Implementar lógica en `index.ts` y exponerla en `run.ts` y en el servidor.
