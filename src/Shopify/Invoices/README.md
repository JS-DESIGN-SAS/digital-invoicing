# Shopify / Invoices

Job para generar **facturas** a partir de órdenes/fuentes de Shopify (ej. BigQuery o API Shopify). Actualmente es un **placeholder**: devuelve un resultado vacío y el mensaje "Job Shopify/Invoices no implementado aún."

## Uso

### CLI

```bash
npm run job:shopify:invoices
```

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/shopify/invoices
```

## Próximos pasos

- Definir fuente de datos (BigQuery, Shopify API, etc.).
- Integrar con API de facturación (Alegra u otra) para emitir facturas.
- Implementar lógica en `index.ts` y exponerla en `run.ts` y en el servidor.
