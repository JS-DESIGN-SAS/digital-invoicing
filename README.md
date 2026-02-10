# Digital Invoicing

Proyecto de facturación digital que corre en **Google Cloud Run**, construido con Docker y disparado por **Cloud Build** al hacer push al repositorio. Desarrollado en **TypeScript**.

## Estructura del proyecto

```
src/
├── Shopify/
│   ├── Clients/    # Crear clientes en Alegra desde órdenes BigQuery (JS_Designs)
│   └── Invoices/   # Facturas desde Shopify (pendiente)
├── Rappi/
│   ├── Clients/    # Clientes desde Rappi
│   └── Invoices/   # Facturas desde Rappi (pendiente)
├── falabellacom/
│   ├── Clients/    # Clientes desde Falabella
│   └── Invoices/   # Facturas desde Falabella (pendiente)
├── Woocommerce_us/
│   ├── Clients/    # Clientes desde WooCommerce US (DIE)
│   └── Invoices/   # Facturas desde WooCommerce US (pendiente)
├── Meli/
│   ├── Clients/    # Clientes desde Meli (Mercado Libre)
│   └── Invoices/   # Facturas desde Meli (pendiente)
├── config/         # BigQuery, Secret Manager
└── server.ts       # API HTTP para Cloud Run
```

## Requisitos

- **Node.js** ≥ 20
- **Cuenta Google Cloud** con Cloud Run, BigQuery, Secret Manager y Cloud Build
- **Service account** con permisos: BigQuery, Secret Manager, y la que use Cloud Run

## Configuración local

1. Clonar y instalar dependencias:

   ```bash
   git clone <repo>
   cd digital-invoicing
   npm install
   ```

2. Variables de entorno (o usar Secret Manager en Cloud):

   - `GOOGLE_CLOUD_PROJECT` o `GCP_PROJECT`: ID del proyecto GCP
   - `ALEGRA_EMAIL`: email Alegra
   - `ALEGRA_TOKEN`: token de API Alegra

   Para desarrollo local puedes usar un `.env` (no subir a Git) o exportar las variables.

3. Autenticación en GCP (local):

   ```bash
   gcloud auth application-default login
   ```

## Scripts

| Comando | Descripción |
|--------|-------------|
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el servidor (tras `npm run build`) |
| `npm run dev` | Servidor en modo desarrollo con recarga |
| `npm run job:shopify:clients` | Ejecuta el job Shopify/Clients por CLI |
| `npm run job:shopify:invoices` | Job Shopify/Invoices (placeholder) |
| `npm run job:rappi:clients` | Job Rappi/Clients |
| `npm run job:rappi:invoices` | Job Rappi/Invoices (placeholder) |
| `npm run job:falabellacom:clients` | Job Falabella/Clients |
| `npm run job:falabellacom:invoices` | Job Falabella/Invoices (placeholder) |
| `npm run job:woocommerce_us:clients` | Job WooCommerce US/Clients |
| `npm run job:woocommerce_us:invoices` | Job WooCommerce US/Invoices (placeholder) |
| `npm run job:meli:clients` | Job Meli (Mercado Libre) / Clients |
| `npm run job:meli:invoices` | Job Meli/Invoices (placeholder) |

## Docker y Cloud Run

### Build y ejecución local con Docker

```bash
docker build -t digital-invoicing .
docker run -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT=tu-proyecto \
  -e ALEGRA_EMAIL=tu-email \
  -e ALEGRA_TOKEN=tu-token \
  digital-invoicing
```

### Despliegue con Cloud Build (trigger en Git)

1. Conectar el repositorio en **Cloud Build** (Triggers).
2. Crear un trigger que:
   - Se dispare en push a la rama que uses (ej. `main`).
   - Usar el archivo `cloudbuild.yaml` de este repo.
3. En el primer despliegue, configurar en Cloud Run:
   - **Secret Manager**: crear secretos `alegra-token` y `alegra-email` y asociarlos como variables de entorno o montar como volumen.
   - O bien inyectar `ALEGRA_TOKEN` y `ALEGRA_EMAIL` como variables de entorno (valor directo o referencia a secreto).

### Endpoints (Cloud Run)

- `GET /health` — Health check.
- `POST /jobs/shopify/clients` — Ejecuta el job de creación de clientes Shopify → Alegra.
- `POST /jobs/shopify/invoices` — Job facturas Shopify (placeholder).
- `POST /jobs/rappi/clients` — Job clientes Rappi.
- `POST /jobs/rappi/invoices` — Job facturas Rappi (placeholder).
- `POST /jobs/falabellacom/clients` — Job clientes Falabella.
- `POST /jobs/falabellacom/invoices` — Job facturas Falabella (placeholder).
- `POST /jobs/woocommerce_us/clients` — Job clientes WooCommerce US.
- `POST /jobs/woocommerce_us/invoices` — Job facturas WooCommerce US (placeholder).
- `POST /jobs/meli/clients` — Job clientes Meli (Mercado Libre).
- `POST /jobs/meli/invoices` — Job facturas Meli (placeholder).

Para automatizar con **Cloud Scheduler**, crea un job que haga un POST a la URL de tu servicio Cloud Run en la ruta del job deseado (y opcionalmente protege con un header/secret).

## Secretos en Google Cloud

- **BigQuery**: el servicio usa **Application Default Credentials**. En Cloud Run es la service account del servicio; en local, `gcloud auth application-default login` o variable `GOOGLE_APPLICATION_CREDENTIALS`.
- **Alegra**: guardar en **Secret Manager**:
  - `alegra-token`
  - `alegra-email`  
  Y dar acceso a la service account de Cloud Run a esos secretos. Luego en Cloud Run puedes mapear las variables de entorno desde esos secretos.

## README por job

- [Shopify / Clients](src/Shopify/Clients/README.md)
- [Shopify / Invoices](src/Shopify/Invoices/README.md)
- [Rappi / Clients](src/Rappi/Clients/README.md)
- [Rappi / Invoices](src/Rappi/Invoices/README.md)
- [Falabella.com / Clients](src/falabellacom/Clients/README.md)
- [Falabella.com / Invoices](src/falabellacom/Invoices/README.md)
- [Woocommerce_us / Clients](src/Woocommerce_us/Clients/README.md)
- [Woocommerce_us / Invoices](src/Woocommerce_us/Invoices/README.md)
- [Meli / Clients](src/Meli/Clients/README.md)
- [Meli / Invoices](src/Meli/Invoices/README.md)
