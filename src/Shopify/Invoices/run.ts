/**
 * CLI para job Shopify/Invoices (pendiente).
 */

import { runShopifyInvoicesJob } from './index';

runShopifyInvoicesJob()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
