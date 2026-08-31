# Final Hardening Checklist

- [ ] English-only user-facing strings verified across app
- [ ] Viewer mutation controls absent across all dashboard routes
- [ ] Server actions enforce Viewer read-only
- [ ] Super Admin is the only role allowed to bulk/raw upload
- [ ] Super Admin and MASB Team can edit normal program records
- [ ] Program 360 add/edit flows use automatic parent relationships
- [ ] Save Changes / Discard Changes verified
- [ ] Modal/page layout survives 80%, 100%, 125%, and 150% zoom
- [ ] Responsive behavior verified at 390, 768, 1024, and 1440px
- [ ] Typecheck passes
- [ ] Production build passes
- [ ] Vercel production deployment is READY
- [ ] Production runtime smoke test passes
