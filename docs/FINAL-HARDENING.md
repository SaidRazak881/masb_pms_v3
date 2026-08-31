# Final Production Hardening

Approved product policy:

- Super Admin: view, add, edit, status changes, and bulk/raw upload.
- MASB Team: view, add, edit, and status changes; no bulk/raw upload.
- Viewer: view only.
- Normal program/business records are editable by Super Admin and MASB Team regardless of ownership.
- Audit/history/import governance records remain controlled and are not generic CRUD targets.
- User-facing UI must be English.
- Dialogs, cards, headers, navigation, and page containers must reflow/scroll safely at browser zoom 80%-150%; wide data tables may use horizontal scrolling.

Verification gate:

1. TypeScript/typecheck passes.
2. Production build passes.
3. CI passes.
4. Vercel production deployment reaches READY.
5. Production HTTP/runtime smoke checks pass.
6. Verify role matrix and Program 360 Save/Discard flows.
