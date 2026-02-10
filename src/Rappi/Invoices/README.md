# Rappi / Invoices

Job para generar **facturas** a partir de órdenes/fuentes de Rappi. Actualmente es un **placeholder**: devuelve un resultado vacío y el mensaje "Job Rappi/Invoices no implementado aún."

## Uso

### CLI

```bash
npm run job:rappi:invoices
```

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/rappi/invoices
```

## Próximos pasos

- Definir fuente de datos (BigQuery, API Rappi, etc.).
- Integrar con API de facturación para emitir facturas.
- Implementar lógica en `index.ts` y exponerla en `run.ts` y en el servidor.
