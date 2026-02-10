/**
 * Servidor HTTP para Cloud Run.
 * Expone rutas de jobs para triggers (Cloud Scheduler, webhooks, etc.).
 */

import express from 'express';
import { runShopifyClientsJob } from './Shopify/Clients';
import { runShopifyInvoicesJob } from './Shopify/Invoices';
import { runRappiClientsJob } from './Rappi/Clients';
import { runRappiInvoicesJob } from './Rappi/Invoices';
import { runFalabellaClientsJob } from './falabellacom/Clients';
import { runFalabellaInvoicesJob } from './falabellacom/Invoices';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'digital-invoicing' });
});

app.post('/jobs/shopify/clients', async (_req, res) => {
  try {
    const result = await runShopifyClientsJob();
    res.json(result);
  } catch (err) {
    console.error('Job shopify/clients failed:', err);
    res.status(500).json({
      error: String(err),
      messages: [],
    });
  }
});

app.post('/jobs/shopify/invoices', async (_req, res) => {
  try {
    const result = await runShopifyInvoicesJob();
    res.json(result);
  } catch (err) {
    console.error('Job shopify/invoices failed:', err);
    res.status(500).json({ error: String(err), messages: [] });
  }
});

app.post('/jobs/rappi/clients', async (_req, res) => {
  try {
    const result = await runRappiClientsJob();
    res.json(result);
  } catch (err) {
    console.error('Job rappi/clients failed:', err);
    res.status(500).json({ error: String(err), messages: [] });
  }
});

app.post('/jobs/rappi/invoices', async (_req, res) => {
  try {
    const result = await runRappiInvoicesJob();
    res.json(result);
  } catch (err) {
    console.error('Job rappi/invoices failed:', err);
    res.status(500).json({ error: String(err), messages: [] });
  }
});

app.post('/jobs/falabellacom/clients', async (_req, res) => {
  try {
    const result = await runFalabellaClientsJob();
    res.json(result);
  } catch (err) {
    console.error('Job falabellacom/clients failed:', err);
    res.status(500).json({ error: String(err), messages: [] });
  }
});

app.post('/jobs/falabellacom/invoices', async (_req, res) => {
  try {
    const result = await runFalabellaInvoicesJob();
    res.json(result);
  } catch (err) {
    console.error('Job falabellacom/invoices failed:', err);
    res.status(500).json({ error: String(err), messages: [] });
  }
});

app.listen(PORT, () => {
  console.log(`digital-invoicing listening on port ${PORT}`);
});
