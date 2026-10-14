# Preview provider setup (2026-10-14)

The active connection panel checks Browserbase, Vapi and Twilio. Retell is no
longer required. Checks authenticate the admin before reading provider metadata;
no browser sessions, assistants, numbers, calls, messages or evidence are created.

## Vapi account owner

Dashboard → API Keys → Private API Keys → Add Key. Name it FIND CS Preview,
create a private token and copy its value. Public keys cannot replace it.
Put it in Vercel as VAPI_PRIVATE_API_KEY, Secret, Preview only.
https://docs.vapi.ai/security-and-privacy/api-keys

## Twilio account owner

Copy the Account SID (AC...) from the account dashboard. Use real account API
credentials for this read-only check, not Twilio's simulated Test Credentials.
Open Settings → Account settings → API keys & auth tokens (legacy Console:
Admin → Account management → Keys & credentials → API keys & tokens).
Create a dedicated FIND CS Preview key in the United States / US1 region.
Choose Restricted and grant only the permission to list active phone numbers:
`twilio/phone-numbers/active-numbers/list`.
Save the key SID (SK...) and secret directly in Vercel; the secret is shown on
creation. No call/create/update/delete permission is needed for this stage.
https://www.twilio.com/docs/iam/api-keys/keys-in-console
https://www.twilio.com/docs/iam/api-keys/restricted-api-keys

| Vercel key | Value | Type / environment |
| --- | --- | --- |
| VAPI_PRIVATE_API_KEY | Vapi private token | Secret / Preview only |
| TWILIO_ACCOUNT_SID | AC... Account SID | Secret / Preview only |
| TWILIO_API_KEY_SID | SK... key SID | Secret / Preview only |
| TWILIO_API_KEY_SECRET | key secret, not account Auth Token | Secret / Preview only |
| BROWSERBASE_API_KEY | existing Browserbase API key | Secret / Preview only |
| BROWSERBASE_PROJECT_ID | existing Browserbase project ID | Secret / Preview only |

Never add VITE_ prefixes or share keys, passwords or key screenshots in chat.
Do not overwrite the existing Supabase variables. After saving, redeploy the
latest Preview deployment. Log into /#/admin → Agent 驗證 → 檢查服務連線.
Report status text only. A successful check with an empty assistant/number list
means API access works; it does not mean an assistant or caller number exists.

## Execution gate

No upgrade, recharge, number purchase or automatic reload is required for these
metadata checks. Account registration does not grant FIND CS API access by itself.
Vapi and Twilio still need their phone integration, an authorized voice-capable
caller number, verified trial recipient, geographic dialing permissions and cost
limits before a controlled call can run. Twilio trial cannot call arbitrary
company hotlines. Contacting real companies or incurring costs needs separately
authorized scope. A read-only Restricted key cannot execute future calls; that
permission must be deliberately provisioned when the execution gate is ready.
Hong Kong short codes, Cantonese IVR and live-human outcome detection remain
unverified. No verification evidence is manufactured by an API connection check.
