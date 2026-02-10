/**
 * CLI para job Rappi/Invoices (pendiente).
 */

import { runRappiInvoicesJob } from './index';

runRappiInvoicesJob()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
