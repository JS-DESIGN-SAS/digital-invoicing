/**
 * Meli / Invoices
 * Job para generar facturas desde Meli (pendiente de implementar).
 */

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

export async function runMeliInvoicesJob(): Promise<JobResult> {
  return {
    total: 0,
    success: 0,
    errors: 0,
    messages: ['Job Meli/Invoices no implementado aún.'],
  };
}
