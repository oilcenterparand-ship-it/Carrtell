# RC1-03D
- Repairs stale/misaligned Super Admin records.
- Setup status now validates a real Auth user joined to an active Super Admin account.
- Reuses the existing `aminoraei@admin.carrtell.local` Auth user and resets its password.
- Removes conflicting stale owner rows and upserts the correct owner row.
- No Supabase CLI or Edge Function is required.
