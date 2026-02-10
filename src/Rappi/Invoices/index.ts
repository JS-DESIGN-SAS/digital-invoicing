/**
 * Rappi / Invoices
 * Job para generar facturas desde Rappi (pendiente de implementar).
 */

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

export async function runRappiInvoicesJob(): Promise<JobResult> {
  return {
    total: 0,
    success: 0,
    errors: 0,
    messages: ['Job Rappi/Invoices no implementado aún.'],
  };
}
