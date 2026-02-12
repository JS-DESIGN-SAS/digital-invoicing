# Shopify / Invoices

Job que ejecuta el **query de líneas a facturar** (órdenes Shopify sin factura en `JS_Designs.Invoices`) y, por ahora, **envía el resultado por correo** a **Anthony@julianasanchez.co** en formato **tabla HTML**. No crea facturas en Alegra todavía.

## Flujo

1. Ejecuta en BigQuery el query migrado de `createInvoices` (Orders + Order_details + Clients + Products, con `UNION ALL` para envíos).
2. Construye una tabla HTML con las columnas: Order ID, Quantity, Client code, Product code, Item price, Discount, Annotation, Tax.
3. Envía el correo usando **Gmail SMTP** con las credenciales configuradas (env o Secret Manager).

## Permisos de la service account (Cloud Scheduler / Cloud Run)

La **service account** que ejecuta el job (la del Cloud Run o la que usa el Scheduler para invocar el endpoint) necesita:

| Permiso / Rol | Uso |
|----------------|-----|
| **BigQuery Data Viewer** (o **BigQuery Job User** + acceso a los datasets) | Ejecutar el query sobre `JS_Designs` (Orders, Order_details, Invoices, Clients, Products). |
| **Secret Manager Secret Accessor** | Leer los secretos que use el job (p. ej. `gmail-smtp-user`, `gmail-smtp-app-password` para el envío del correo; y si aplica `alegra-token`, `alegra-email`). |

No se usa “la service account para enviar el correo” directamente: el envío se hace con **Gmail SMTP** usando un usuario (ej. Anthony@julianasanchez.co) y una **contraseña de aplicación**. La service account solo necesita poder **leer** esas credenciales desde Secret Manager (o que se inyecten por variables de entorno).

### Resumen mínimo

- **BigQuery**: acceso de lectura a los datasets/tablas del proyecto (p. ej. `JS_Designs.*`).
- **Secret Manager**: acceso de lector a los secretos usados por este job (ver abajo).

## Configuración del correo

Crear en **Secret Manager** (o definir variables de entorno). Se usan los secretos genéricos de correo (compartidos por todos los jobs que envían email):

| Secreto | Descripción |
|---------|-------------|
| `gmail-smtp-user` | Cuenta Gmail que envía (ej. Anthony@julianasanchez.co). |
| `gmail-smtp-app-password` | Contraseña de aplicación de Gmail (no la contraseña normal). |

Alternativa por variables de entorno: `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`.

Para obtener la contraseña de aplicación: Cuenta Google → Seguridad → Verificación en 2 pasos activada → Contraseñas de aplicaciones → generar una para “Correo”.

Dar a la **service account** del Cloud Run (o la que ejecute el job) el rol **Secret Manager Secret Accessor** sobre esos secretos (o sobre el proyecto si aplica).

## Uso

- **CLI:** `npm run job:shopify:invoices`
- **HTTP:** `POST /jobs/shopify/invoices`

El resultado del job incluye `total`, `success`, `errors` y `messages` (por ejemplo “Query devolvió N filas”, “Correo enviado a Anthony@julianasanchez.co …”).

## Query

El query replica la lógica del script original: `temp_table` con facturas recientes, órdenes con estado processing/addi-approved/PAID, sin factura, join con Clients por documento normalizado, y con Products por SKU. Incluye el `UNION ALL` para añadir la línea de envío (product_code 3579) cuando aplica.
