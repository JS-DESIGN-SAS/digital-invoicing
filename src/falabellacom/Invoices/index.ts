/**
 * Falabella.com / Invoices
 * Job para generar facturas desde Falabella (pendiente de implementar).
 */

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

export async function runFalabellaInvoicesJob(): Promise<JobResult> {
  return {
    total: 0,
    success: 0,
    errors: 0,
    messages: ['Job Falabella/Invoices no implementado aún.'],
  };
}
