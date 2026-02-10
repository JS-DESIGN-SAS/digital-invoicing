/**
 * Carga de secretos desde Google Cloud Secret Manager o variables de entorno.
 * En Cloud Run los secretos se inyectan como env o se leen desde Secret Manager.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export interface AlegraSecrets {
  token: string;
  user: string;
}

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || '';

async function getSecret(name: string, version = 'latest'): Promise<string> {
  if (!PROJECT_ID) {
    throw new Error('GOOGLE_CLOUD_PROJECT or GCP_PROJECT must be set');
  }
  const [version_res] = await client.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${name}/versions/${version}`,
  });
  const payload = version_res.payload?.data;
  if (!payload) {
    throw new Error(`Secret ${name} has no payload`);
  }
  return typeof payload === 'string' ? payload : payload.toString('utf8');
}

/**
 * Obtiene credenciales de Alegra.
 * Variables de entorno: ALEGRA_TOKEN, ALEGRA_USER (para local o override).
 * Secret Manager: alegra-token, alegra-user (en Cloud).
 */
export async function getAlegraSecrets(): Promise<AlegraSecrets> {
  if (process.env.ALEGRA_TOKEN && process.env.ALEGRA_USER) {
    return { token: process.env.ALEGRA_TOKEN, user: process.env.ALEGRA_USER };
  }
  try {
    const [token, user] = await Promise.all([
      getSecret('alegra-token'),
      getSecret('alegra-user'),
    ]);
    return { token: token.trim(), user: user.trim() };
  } catch (e) {
    throw new Error(
      'Configure ALEGRA_TOKEN y ALEGRA_USER (env) o secretos alegra-token y alegra-user en Secret Manager. ' +
        String(e)
    );
  }
}
