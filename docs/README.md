Carrtell Ops Complete Patch

1) Copy __patch__, docs, scripts into the project root.
2) Run: node scripts/apply-ops-complete-patch.mjs
3) Run SQL in Supabase: docs/sql/2026_ops_complete_workflow.sql
4) Restart Vite.

Routes affected/used:
- /admin/dispatch
- /driver/dashboard
- /driver/jobs/test
- /driver/jobs/:id
