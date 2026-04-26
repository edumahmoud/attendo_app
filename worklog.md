---
Task ID: 1
Agent: Main Agent
Task: Fix redirect from admin account creation to institution creation page + implement institution management page

Work Log:
- Analyzed the race condition in SetupWizard: `onStart()` (which sets `wizardInProgress=true`) was called AFTER `supabase.auth.signUp()`, but the auth state change fires immediately and sets `user`, causing the wizard to disappear before the institution step
- Moved `onStart?.()` call to BEFORE the signup call in `handleCreateAdmin` 
- Added `onError` callback to reset `wizardInProgress` when signup fails
- Updated `page.tsx` to handle the `onError` callback
- Added `'institution'` to `AdminSection` type in types.ts
- Created new `InstitutionSection` component at `src/components/admin/institution-section.tsx`
- Added institution nav item to admin dashboard sidebar
- Added institution section rendering in admin dashboard
- Imported `Building2` icon in admin dashboard
- Verified lint passes and dev server compiles successfully

Stage Summary:
- **Root cause**: Race condition - `onStart()` was called after `supabase.auth.signUp()`, but the auth listener fires and sets `user` before `wizardInProgress` is set to true, causing the wizard to disappear
- **Fix**: Call `onStart?.()` BEFORE the signup call so `wizardInProgress=true` before any auth state changes
- **New component**: `InstitutionSection` - full institution management page in admin dashboard with logo upload, type selection, basic info, contact info, and description
- **New admin section**: "المؤسسة" added to admin sidebar navigation
