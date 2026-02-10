/**
 * Woocommerce_us / Invoices
 * Job para generar facturas desde WooCommerce US (pendiente de implementar).
 */

export interface JobResult {
  total: number;
  success: number;
  errors: number;
  messages: string[];
}

export async function runWoocommerceUsInvoicesJob(): Promise<JobResult> {
  return {
    total: 0,
    success: 0,
    errors: 0,
    messages: ['Job Woocommerce_us/Invoices no implementado aún.'],
  };
}
