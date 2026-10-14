import { Buffer } from 'node:buffer';
// Read-only credential checks. This module never creates a call/session or verification.
const jsonHeaders = { 'Content-Type': 'application/json' };
const missing = provider => ({ provider, state: 'missing_config', executionEnabled: false });
async function request(fetchImpl, url, options = {}) {
  return fetchImpl(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(5000) });
}
async function providerCheck(provider, env, fetchImpl) {
  let url, options, expectedProject;
  if (provider === 'browserbase') {
    if (!env.BROWSERBASE_API_KEY || !env.BROWSERBASE_PROJECT_ID) return missing(provider);
    expectedProject = env.BROWSERBASE_PROJECT_ID.trim();
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(expectedProject)) return { ...missing(provider), state: 'invalid_config' };
    url = `https://api.browserbase.com/v1/projects/${expectedProject}`;
    options = { headers: { 'X-BB-API-Key': env.BROWSERBASE_API_KEY } };
  } else if (provider === 'vapi') {
    if (!env.VAPI_PRIVATE_API_KEY) return missing(provider);
    url = 'https://api.vapi.ai/assistant';
    options = { headers: { Authorization: `Bearer ${env.VAPI_PRIVATE_API_KEY}` } };
  } else {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_API_KEY_SID || !env.TWILIO_API_KEY_SECRET) return missing(provider);
    if (!/^AC[0-9a-fA-F]{32}$/.test(env.TWILIO_ACCOUNT_SID) || !/^SK[0-9a-fA-F]{32}$/.test(env.TWILIO_API_KEY_SID))
      return { ...missing(provider), state: 'invalid_config' };
    url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PageSize=1`;
    const credentials = Buffer.from(`${env.TWILIO_API_KEY_SID}:${env.TWILIO_API_KEY_SECRET}`).toString('base64');
    options = { headers: { Authorization: `Basic ${credentials}` } };
  }
  try {
    const response = await request(fetchImpl, url, options);
    if (!response.ok) return { provider, state: [401, 403].includes(response.status) ? 'credentials_rejected' : response.status === 429 ? 'rate_limited' : 'provider_error', executionEnabled: false };
    const data = await response.json();
    const valid = provider === 'browserbase' ? data?.id === expectedProject : provider === 'vapi' ? Array.isArray(data) : Array.isArray(data?.incoming_phone_numbers);
    if (!valid) return { provider, state: 'invalid_response', executionEnabled: false };
    return { provider, state: 'api_connected', executionEnabled: false };
  } catch { return { provider, state: 'connection_failed', executionEnabled: false }; }
}
export async function inspectConnections({ authorization, env, fetchImpl = fetch }) {
  if (typeof authorization !== 'string' || !/^Bearer [^\s]{1,8192}$/.test(authorization))
    return { status: 401, body: { error: 'authentication_required' } };
  const base = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  try { if (new URL(base).protocol !== 'https:' || !key) throw new Error(); }
  catch { return { status: 503, body: { error: 'server_auth_not_configured' } }; }
  const headers = { ...jsonHeaders, apikey: key, Authorization: authorization };
  try {
    const userResponse = await request(fetchImpl, `${base.replace(/\/$/, '')}/auth/v1/user`, { headers });
    if ([401, 403].includes(userResponse.status)) return { status: 401, body: { error: 'invalid_session' } };
    if (!userResponse.ok) throw new Error();
    const user = await userResponse.json();
    if (typeof user?.id !== 'string' || !user.id) return { status: 401, body: { error: 'invalid_session' } };
    const adminResponse = await request(fetchImpl, `${base.replace(/\/$/, '')}/rest/v1/rpc/is_admin`, { method: 'POST', headers, body: '{}' });
    if (!adminResponse.ok) throw new Error();
    if (await adminResponse.json() !== true) return { status: 403, body: { error: 'administrator_required' } };
  } catch { return { status: 503, body: { error: 'authorization_unavailable' } }; }
  const providers = await Promise.all(['browserbase', 'vapi', 'twilio'].map(provider => providerCheck(provider, env, fetchImpl)));
  return { status: 200, body: { checkedAt: new Date().toISOString(), providers, executionEnabled: false } };
}
