/**
 * Cliente BigQuery. En GCP usa Application Default Credentials (service account).
 */

import { BigQuery } from '@google-cloud/bigquery';

const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'js-design-416617';

export const bigquery = new BigQuery({ projectId });

export function getProjectId(): string {
  return projectId;
}
