/**
 * CLI: Job Falabella/Invoices
 */

import { runFalabellaInvoicesJob } from './index';

runFalabellaInvoicesJob()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
