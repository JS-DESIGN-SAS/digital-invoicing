/**
 * Carga de secretos desde Google Cloud Secret Manager o variables de entorno.
 * En Cloud Run los secretos se inyectan como env o se leen desde Secret Manager.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export interface AlegraSecrets {
  token: string;
  email: string;
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
 * Variables de entorno: ALEGRA_TOKEN, ALEGRA_EMAIL (para local o override).
 * Secret Manager: alegra-token, alegra-email (en Cloud).
 */
export async function getAlegraSecrets(): Promise<AlegraSecrets> {
  if (process.env.ALEGRA_TOKEN && process.env.ALEGRA_EMAIL) {
    return { token: process.env.ALEGRA_TOKEN, email: process.env.ALEGRA_EMAIL };
  }
  try {
    const [token, email] = await Promise.all([
      getSecret('alegra-token'),
      getSecret('alegra-email'),
    ]);
    return { token: token.trim(), email: email.trim() };
  } catch (e) {
    throw new Error(
      'Configure ALEGRA_TOKEN y ALEGRA_EMAIL (env) o secretos alegra-token y alegra-email en Secret Manager. ' +
        String(e)
    );
  }
}

export interface EmailSecrets {
  user: string;
  appPassword: string;
}

/**
 * Credenciales para envío de correo (reportes, facturas, notificaciones).
 * Variables de entorno: GMAIL_SMTP_USER, GMAIL_SMTP_APP_PASSWORD.
 * Secret Manager: gmail-smtp-user, gmail-smtp-app-password.
 */
export async function getEmailSecrets(): Promise<EmailSecrets> {
  if (process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_APP_PASSWORD) {
    return {
      user: process.env.GMAIL_SMTP_USER.trim(),
      appPassword: process.env.GMAIL_SMTP_APP_PASSWORD.trim(),
    };
  }
  try {
    const [user, appPassword] = await Promise.all([
      getSecret('gmail-smtp-user'),
      getSecret('gmail-smtp-app-password'),
    ]);
    return { user: user.trim(), appPassword: appPassword.trim() };
  } catch (e) {
    throw new Error(
      'Configure GMAIL_SMTP_USER y GMAIL_SMTP_APP_PASSWORD (env) o secretos gmail-smtp-user y gmail-smtp-app-password en Secret Manager. ' +
        String(e)
    );
  }
}

export interface GrabilitySecrets {
  clientId: string;
  clientSecret: string;
}

/**
 * Credenciales para API Grability (Rappi). Login y GET order para validar total_with_discount.
 * Variables de entorno: RAPPI_GRABILITY_CLIENT_ID, RAPPI_GRABILITY_CLIENT_SECRET.
 * Secret Manager: rappi-grability-client-id, rappi-grability-client-secret.
 */
export async function getGrabilitySecrets(): Promise<GrabilitySecrets> {
  if (process.env.RAPPI_GRABILITY_CLIENT_ID && process.env.RAPPI_GRABILITY_CLIENT_SECRET) {
    return {
      clientId: process.env.RAPPI_GRABILITY_CLIENT_ID.trim(),
      clientSecret: process.env.RAPPI_GRABILITY_CLIENT_SECRET.trim(),
    };
  }
  try {
    const [clientId, clientSecret] = await Promise.all([
      getSecret('rappi-grability-client-id'),
      getSecret('rappi-grability-client-secret'),
    ]);
    return { clientId: clientId.trim(), clientSecret: clientSecret.trim() };
  } catch (e) {
    throw new Error(
      'Configure RAPPI_GRABILITY_CLIENT_ID y RAPPI_GRABILITY_CLIENT_SECRET (env) o secretos rappi-grability-client-id y rappi-grability-client-secret en Secret Manager. ' +
        String(e)
    );
  }
}
