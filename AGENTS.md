# FIND CS working rules

- Work on Preview only. Do not push Production/main without explicit authorization.
- Preserve user changes and check remote HEAD before publishing a new commit.
- No paid APIs/services or real-world customer contact without explicit authorization.
- User-approved delegation: primary Astra Medium (user selects UI); Sol Low for
  scoped implementation, Terra Low for mechanical checks, Sol Medium for complex
  review. Normally at most two child agents. Do not create agents for trivial tasks.
- Read docs/DELIVERY.md for current integration gates and docs/database.md for schema.
- Treat src/data as prototype fixtures, never real verification evidence.
- No secret/service-role keys in frontend or repository. Admin UI is not the
  authorization boundary: database RLS must enforce every data operation.
- Test negative cases, permission failures and stale data; a passing build alone is
  not acceptance. Report exactly which checks ran and which require live credentials.
- Record unresolved high-risk issues as blockers, not accepted residual risk.
