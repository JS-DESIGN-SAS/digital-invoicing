/**
 * Job: WooCommerce US → Clients
 * Consulta BigQuery por órdenes US sin factura ni cliente y crea los contactos en Alegra.
 */

import { queryClients } from './query';
import { createClient } from './alegra';

const DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('Job Woocommerce_us/Clients: querying BigQuery...');
  const rows = await queryClients();
  if (rows.length === 0) {
    console.log('No hay clientes nuevos por crear.');
    return;
  }
  console.log(`Found ${rows.length} clients to create.`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const result = await createClient(row);
      const name = `${row.firstName} ${row.lastName}`.trim();
      console.log(`[${i + 1}/${rows.length}] ${name} (order ${row.orderId}) -> ${result.status} ${result.body}`);
      if (!result.ok) {
        console.error('Alegra error:', result.body);
      }
    } catch (err) {
      console.error(`[${i + 1}/${rows.length}] Error:`, err);
    }
    if (i < rows.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('Job Woocommerce_us/Clients finished.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
