import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getDb() {
  const ctx = await getCloudflareContext({ async: true });
  if (!ctx?.env?.DB) {
    throw new Error('D1 binding "DB" is not available. Check wrangler.toml.');
  }

  return ctx.env.DB;
}
