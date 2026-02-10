/**
 * Rappi / Clients
 * Job para crear clientes desde Rappi (pendiente de implementar).
 */

export interface JobResult {
  total: number;
  created: number;
  errors: number;
  messages: string[];
}

export async function runRappiClientsJob(): Promise<JobResult> {
  return {
    total: 0,
    created: 0,
    errors: 0,
    messages: ['Job Rappi/Clients no implementado aún.'],
  };
}
