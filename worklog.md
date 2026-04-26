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

---
Task ID: 2
Agent: Main Agent
Task: Display institution data across the app (header, login, register) + restrict institution management to superadmin only

Work Log:
- Created `InstitutionStore` (Zustand) at `src/stores/institution-store.ts` - global store for institution data with caching
- Updated `AppHeader` - added `HeaderLogo` and `HeaderTitle` sub-components that show institution logo/name (fallback to GraduationCap icon + "أتيندو")
- Updated `LoginForm` - shows institution logo in the icon circle and institution name in "مرحباً بك في [name]"
- Updated `RegisterForm` - shows institution logo and "انضم إلى [name] وابدأ رحلتك التعليمية"
- Added `superadminOnly` flag to institution nav item in admin dashboard
- Filtered nav items in admin sidebar: institution section only visible to superadmin
- Added role check to `/api/setup` POST route - only superadmin can modify institution settings
- Added auth token to InstitutionSection save request so it passes the role check
- InstitutionSection updates global store after fetching/saving so header reflects changes immediately
- Lint passes, dev server compiles successfully

Stage Summary:
- **InstitutionStore**: Global Zustand store for institution data (name, logo_url, type, etc.)
- **Header**: Shows institution logo (if set) and name (if set), otherwise defaults to GraduationCap + "أتيندو"
- **Login/Register**: Shows institution logo and name dynamically
- **Permissions**: Only superadmin sees "المؤسسة" in sidebar + can modify data via API
- **No DB changes needed**: All existing tables/RLS policies already support this
