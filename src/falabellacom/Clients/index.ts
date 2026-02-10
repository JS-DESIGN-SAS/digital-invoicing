/**
 * Falabella.com / Clients
 * Exporta el runner del job para invocación HTTP (Cloud Run).
 */

import { queryClients } from './query';
import { createClient } from './alegra';

const DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface JobResult {
  total: number;
  created: number;
  errors: number;
  messages: string[];
}

export async function runFalabellaClientsJob(): Promise<JobResult> {
  const messages: string[] = [];
  let created = 0;
  let errors = 0;

  const rows = await queryClients();
  messages.push(`BigQuery returned ${rows.length} rows.`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const result = await createClient(row);
      const name = `${row.first_name} ${row.last_name}`.trim();
      const line = `[${i + 1}/${rows.length}] ${name} -> ${result.status}`;
      messages.push(line);
      if (result.ok) created++;
      else {
        errors++;
        messages.push(`  Body: ${result.body}`);
      }
    } catch (err) {
      errors++;
      messages.push(`[${i + 1}/${rows.length}] Error: ${String(err)}`);
    }
    if (i < rows.length - 1) await sleep(DELAY_MS);
  }

  return { total: rows.length, created, errors, messages };
}
