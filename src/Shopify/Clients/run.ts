/**
 * Job: Shopify → Clients
 * Consulta BigQuery por órdenes sin factura ni cliente en JS_Designs.Clients
 * y crea los contactos en Alegra.
 */

import { queryClients } from './query';
import { createClient } from './alegra';

const DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('Job Shopify/Clients: querying BigQuery...');
  const rows = await queryClients();
  console.log(`Found ${rows.length} clients to create.`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const result = await createClient(row);
      console.log(`[${i + 1}/${rows.length}] ${row.firstName} ${row.lastName} -> ${result.status} ${result.body}`);
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

  console.log('Job Shopify/Clients finished.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
