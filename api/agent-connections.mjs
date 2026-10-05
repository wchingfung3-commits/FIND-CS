import { inspectConnections } from '../server/provider-connections.mjs';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const result = await inspectConnections({ authorization: req.headers.authorization, env: process.env });
  return res.status(result.status).json(result.body);
}
