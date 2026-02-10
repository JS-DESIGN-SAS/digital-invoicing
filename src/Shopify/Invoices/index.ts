/**
 * Shopify / Invoices
 * Job para generar facturas desde órdenes Shopify (pendiente de implementar).
 */

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

export async function runShopifyInvoicesJob(): Promise<JobResult> {
  return {
    total: 0,
    success: 0,
    errors: 0,
    messages: ['Job Shopify/Invoices no implementado aún.'],
  };
}
