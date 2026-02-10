/**
 * CLI para job Woocommerce_us/Invoices (pendiente).
 */

import { runWoocommerceUsInvoicesJob } from './index';

runWoocommerceUsInvoicesJob()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
