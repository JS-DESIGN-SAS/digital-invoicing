/**
 * CLI para job Meli/Invoices (pendiente).
 */

import { runMeliInvoicesJob } from './index';

runMeliInvoicesJob()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
