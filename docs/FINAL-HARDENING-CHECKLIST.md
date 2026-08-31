# Final Hardening Checklist

## Roles
- [x] English-only user-facing strings verified across the audited application paths
- [x] Viewer mutation controls are permission-gated in the Program 360 mutation surfaces
- [x] Server actions enforce edit authorization
- [x] Super Admin is the only role allowed to enter the bulk/raw import center
- [x] Super Admin and MASB Team can edit normal program records
- [x] Program 360 add/edit flows use automatic parent relationships
- [x] Save Changes / Discard Changes are provided by the record editor

## Data integrity
- [x] Participant roster uses `week_label` consistently
- [x] Participant attendance uses `attendance_date`
- [x] Pipeline stage changes are validated and audited
- [x] Audit/history/import governance tables remain outside generic CRUD

## UX
- [x] Edit/create dialogs have scroll-safe high-zoom layout foundations
- [ ] Full browser visual QA at 80%, 100%, 125%, and 150% zoom
- [ ] Full responsive visual QA at 390, 768, 1024, and 1440px

## Release verification
- [x] TypeScript production build blocker was fixed
- [x] Production build was previously verified green for the release commit
- [x] Vercel production deployment reached READY for the release commit
- [x] Production HTTP smoke test returned 200
- [x] Production runtime error/fatal log check was clean at the release checkpoint
- [ ] Authenticated end-to-end CRUD smoke test with each role

## Release gate

The remaining unchecked items require browser-level visual/authenticated testing that is not safely inferable from repository source alone. Do not mark them complete without executing those tests.
