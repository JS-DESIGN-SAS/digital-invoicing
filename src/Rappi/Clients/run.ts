/**
 * CLI para job Rappi/Clients (pendiente).
 */

import { runRappiClientsJob } from './index';

runRappiClientsJob()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
