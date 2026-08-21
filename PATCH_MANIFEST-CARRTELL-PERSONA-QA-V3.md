# Patch Manifest — Carrtell Persona QA Agent v3

## فایل‌های تغییرکرده
- `agent.ps1` — اضافه شدن Modeهای PERSONAS / ADMIN / TECHNICIAN / CUSTOMER3
- `package.json` — اضافه شدن اسکریپت‌های Persona QA

## فایل‌های جدید
- `playwright.persona.config.ts`
- `tests/e2e/helpers/personaAudit.ts`
- `tests/e2e/persona-customer.spec.ts`
- `tests/e2e/persona-admin.spec.ts`
- `tests/e2e/persona-technician.spec.ts`
- `scripts/persona-reporter.mjs`
- `CARRTELL_PERSONA_QA_AGENT.md`
- `PATCH_MANIFEST-CARRTELL-PERSONA-QA-V3.md`

## SQL
SQL لازم نیست.

## امنیت
هیچ Secret جدیدی وارد Frontend نشده است. Credentialهای تست فقط از Environment Variable خوانده می‌شوند.
