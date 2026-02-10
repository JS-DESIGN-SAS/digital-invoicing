# Digital Invoicing

Proyecto de facturación digital que corre en **Google Cloud Run**, construido con Docker y disparado por **Cloud Build** al hacer push al repositorio. Desarrollado en **TypeScript**.

## Estructura del proyecto

```
src/
├── Shopify/
│   ├── Clients/    # Crear clientes en Alegra desde órdenes BigQuery (JS_Designs)
│   └── Invoices/   # Facturas desde Shopify (pendiente)
├── Rappi/
│   ├── Clients/    # Clientes desde Rappi (pendiente)
│   └── Invoices/   # Facturas desde Rappi (pendiente)
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
   - `ALEGRA_USER`: usuario Alegra (ej. email)
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
| `npm run job:rappi:clients` | Job Rappi/Clients (placeholder) |
| `npm run job:rappi:invoices` | Job Rappi/Invoices (placeholder) |

## Docker y Cloud Run

### Build y ejecución local con Docker

```bash
docker build -t digital-invoicing .
docker run -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT=tu-proyecto \
  -e ALEGRA_USER=tu-user \
  -e ALEGRA_TOKEN=tu-token \
  digital-invoicing
```

### Despliegue con Cloud Build (trigger en Git)

1. Conectar el repositorio en **Cloud Build** (Triggers).
2. Crear un trigger que:
   - Se dispare en push a la rama que uses (ej. `main`).
   - Usar el archivo `cloudbuild.yaml` de este repo.
3. En el primer despliegue, configurar en Cloud Run:
   - **Secret Manager**: crear secretos `alegra-token` y `alegra-user` y asociarlos como variables de entorno o montar como volumen.
   - O bien inyectar `ALEGRA_TOKEN` y `ALEGRA_USER` como variables de entorno (valor directo o referencia a secreto).

### Endpoints (Cloud Run)

- `GET /health` — Health check.
- `POST /jobs/shopify/clients` — Ejecuta el job de creación de clientes Shopify → Alegra.
- `POST /jobs/shopify/invoices` — Job facturas Shopify (placeholder).
- `POST /jobs/rappi/clients` — Job clientes Rappi (placeholder).
- `POST /jobs/rappi/invoices` — Job facturas Rappi (placeholder).

Para automatizar con **Cloud Scheduler**, crea un job que haga un POST a la URL de tu servicio Cloud Run en la ruta del job deseado (y opcionalmente protege con un header/secret).

## Secretos en Google Cloud

- **BigQuery**: el servicio usa **Application Default Credentials**. En Cloud Run es la service account del servicio; en local, `gcloud auth application-default login` o variable `GOOGLE_APPLICATION_CREDENTIALS`.
- **Alegra**: guardar en **Secret Manager**:
  - `alegra-token`
  - `alegra-user`  
  Y dar acceso a la service account de Cloud Run a esos secretos. Luego en Cloud Run puedes mapear las variables de entorno desde esos secretos.

## README por job

- [Shopify / Clients](src/Shopify/Clients/README.md)
- [Shopify / Invoices](src/Shopify/Invoices/README.md)
- [Rappi / Clients](src/Rappi/Clients/README.md)
- [Rappi / Invoices](src/Rappi/Invoices/README.md)
