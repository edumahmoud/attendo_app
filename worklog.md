---
Task ID: 1
Agent: Main Agent
Task: إصلاح مشكلة قاعدة البيانات - سياسات RLS المكسورة تمنع الحسابات من رؤية بيانات بعضها

Work Log:
- Analyzed the RLS policies in COMPLETE_SCHEMA.sql
- Found that "Admins can read all users" policy was broken - it only allowed admins to read their own profile instead of all users
- Found that there was no general policy for authenticated users to read other users' profiles
- Fixed the admin RLS policy using EXISTS subquery instead of the broken OR/IN logic
- Added "Authenticated users can read profiles" policy so all authenticated users can see each other's basic profile info
- Added storage policy for reading institution logos from the `institution/` folder in the `user-files` bucket
- Updated both COMPLETE_SCHEMA.sql and created fix_rls_policies.sql migration file

Stage Summary:
- Fixed "Admins can read all users" RLS policy (was broken, now uses EXISTS subquery)
- Added "Authenticated users can read profiles" RLS policy (any authenticated user can read any profile)
- Added "Anyone can read institution logos" storage policy (for displaying logos on login pages)
- Created migration file: supabase/fix_rls_policies.sql for existing databases

---
Task ID: 2
Agent: Main Agent
Task: إصلاح مشكلة صورة شعار المؤسسة تظهر مكان صورة المستخدم

Work Log:
- Analyzed the institution logo upload flow in institution-section.tsx
- Found that logo upload was using /api/avatar endpoint which updates user's avatar_url in the database
- Created new dedicated /api/institution-logo endpoint that uploads to separate path (institution/logos/) without touching users table
- Updated institution-section.tsx to use the new endpoint instead of /api/avatar
- The logo URL is still saved to institution_settings.logo_url when the user saves the form

Stage Summary:
- Created new API: /api/institution-logo/route.ts (separate from /api/avatar)
- Institution logos now upload to `institution/logos/` folder instead of `{userId}/avatar_*`
- No longer overwrites user's avatar_url in the database
- Updated institution-section.tsx to use new endpoint

---
Task ID: 3
Agent: Main Agent
Task: (إجباري) إصلاح z-index صفحة البروفايل لتظهر تحت القائمة الجانبية

Work Log:
- Found that the profile page wrapper had z-20 and the main had z-10, creating problematic stacking contexts
- The sidebar uses z-30 and header uses z-40, so the profile page at z-20 would compete with sidebar
- Removed z-20 from the profile page wrapper div
- Removed z-10 from the main element inside the profile page
- Also fixed openProfile function in app-store.ts to close the sidebar when navigating to a profile

Stage Summary:
- Removed unnecessary z-20 and z-10 from profile page (page.tsx lines 293, 323)
- Updated openProfile in app-store.ts to also set sidebarOpen: false
- Profile page now renders at default z-index, allowing sidebar (z-30) and header (z-40) to properly overlay it
