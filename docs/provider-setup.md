# Preview provider setup

The admin Agent panel checks server-side API access. It does not execute jobs,
create browser sessions, dial numbers, accept evidence or publish routes.

## Account owner actions

1. Create a Browserbase account at https://www.browserbase.com/ . Select Free;
   do not upgrade or enable paid add-ons. Copy its API key and Project ID.
2. Create a Retell account at https://www.retellai.com/ . Copy its API key.
   No telephone number or paid plan is required for the metadata check.
3. In Vercel, open the existing FIND CS project → Settings → Environment Variables.
   Add the following as **Secret**, targeting **Preview only**. Never use a VITE_
   prefix or paste keys into chat. Do not replace the existing Supabase variables.

| Key | Value |
| --- | --- |
| BROWSERBASE_API_KEY | Browserbase API key |
| BROWSERBASE_PROJECT_ID | Browserbase Project ID |
| RETELL_API_KEY | Retell API key |

4. Redeploy the latest Preview deployment, choosing Preview. Log into /#/admin,
   open Agent verification and press 檢查服務連線. Report status text only.

If a provider asks for CAPTCHA, email confirmation, account authorization or KYC,
complete it personally on the official provider site. Never share passwords or ID
images here. Retell outbound verification can require Persona identity checks.

## Cost and Hong Kong voice gate

Browserbase advertises a Free tier with limited usage. Retell advertises $10 signup
credits; these are not unlimited free telephone service. Its managed international
telephony country list currently excludes Hong Kong. A +852 calling path therefore
needs separately verified custom telephony and a cost cap before execution.
Twilio trial outbound destinations must belong to the user and be verified; that
trial cannot call arbitrary company hotlines. No paid telephony, number purchase,
automatic recharge or real-company call is authorized by this setup.

API access success does not establish Hong Kong calling support, working browser
execution, cost enforcement, callbacks, job leases or accepted evidence. Those gates
remain closed until implemented and tested. Provider credentials are not currently
configured in Vercel as of this checkpoint.

References checked 2026-10-05:
- https://www.browserbase.com/pricing
- https://www.retellai.com/pricing
- https://docs.retellai.com/deploy/international-call
- https://docs.retellai.com/deploy/kyc
- https://www.twilio.com/en-us/voice/pricing/hk
- https://www.twilio.com/docs/api/errors/21219
