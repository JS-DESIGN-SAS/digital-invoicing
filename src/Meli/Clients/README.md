# Meli / Clients

Job que obtiene órdenes de **BigQuery** (tabla `JS_Designs.Orders_Meli`) que aún no tienen factura ni cliente en `JS_Designs.Clients`, y crea los **contactos (clientes)** en **Alegra**. Origen: Mercado Libre (Meli).

## Lógica

1. **Query BigQuery**: facturas recientes en `temp_table` (date > 2024-12-01, status <> 'void'). Órdenes Meli con join por `IFNULL(Pack_id, id) = webOrderId` y por `Document_number = D.document_number`. Join con `JS_Designs.Source_Cities` por código estado (DC→BOG) y ciudad normalizada. Filtro: sin factura y sin cliente (D.id IS NULL).
2. Email fijo **contacto@julianasanchez.co**; teléfono null. Tipo de persona y régimen según prefijo del documento (NIT → LEGAL_ENTITY / COMMON_REGIME).
3. Por cada fila se arma el payload de Alegra (address siempre) y se envía **POST** a la API de contactos. Delay 5 s entre llamadas.

## Uso

### CLI

```bash
npm run job:meli:clients
```

### HTTP (Cloud Run)

```bash
curl -X POST https://<tu-url-cloud-run>/jobs/meli/clients
```

## Configuración

Mismos secretos que el resto: `ALEGRA_EMAIL` y `ALEGRA_TOKEN`. Service account con acceso a BigQuery.
