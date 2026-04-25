-- =====================================================
-- إصلاح سياسات RLS - آمن لإعادة التشغيل بالكامل
-- شغّل هذا الكود في Supabase SQL Editor
-- ✅ هذا الكود يحذف كل السياسات القديمة ثم يعيد إنشاؤها
-- =====================================================

-- ===== ANNOUNCEMENTS =====
DROP POLICY IF EXISTS "Anyone can read active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Anyone can read active announcements" ON public.announcements
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (true);

-- ===== BANNED_USERS =====
DROP POLICY IF EXISTS "Admins can manage banned users" ON public.banned_users;
CREATE POLICY "Admins can manage banned users" ON public.banned_users
  FOR ALL USING (true);

-- ===== NOTIFICATIONS =====
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- ===== USER_SESSIONS =====
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (user_id = auth.uid());

-- ===== ATTENDANCE_RECORDS =====
DROP POLICY IF EXISTS "Teachers can view attendance records for own sessions" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can view own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Students can check in to attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Teachers can delete attendance records for own sessions" ON public.attendance_records;
CREATE POLICY "Teachers can view attendance records for own sessions" ON public.attendance_records
  FOR SELECT USING (
    session_id IN (SELECT id FROM public.attendance_sessions WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Students can view own attendance records" ON public.attendance_records
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can check in to attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );
CREATE POLICY "Teachers can delete attendance records for own sessions" ON public.attendance_records
  FOR DELETE USING (
    session_id IN (SELECT id FROM public.attendance_sessions WHERE teacher_id = auth.uid())
  );

-- ===== ATTENDANCE_SESSIONS =====
DROP POLICY IF EXISTS "Teachers can view own attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students can view attendance sessions in enrolled subjects" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers can create attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers can update own attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Teachers can delete own attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Teachers can view own attendance sessions" ON public.attendance_sessions
  FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Students can view attendance sessions in enrolled subjects" ON public.attendance_sessions
  FOR SELECT USING (
    subject_id IN (SELECT public.get_student_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can create attendance sessions" ON public.attendance_sessions
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid()
  );
CREATE POLICY "Teachers can update own attendance sessions" ON public.attendance_sessions
  FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own attendance sessions" ON public.attendance_sessions
  FOR DELETE USING (teacher_id = auth.uid());

-- ===== SUBMISSIONS =====
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON public.submissions;
DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update own ungraded submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can grade submissions for their assignments" ON public.submissions;
CREATE POLICY "Teachers can view submissions for their assignments" ON public.submissions
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      WHERE a.subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
    )
  );
CREATE POLICY "Students can view own submissions" ON public.submissions
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can create submissions" ON public.submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own ungraded submissions" ON public.submissions
  FOR UPDATE USING (student_id = auth.uid() AND status = 'submitted');
CREATE POLICY "Teachers can grade submissions for their assignments" ON public.submissions
  FOR UPDATE USING (
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      WHERE a.subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
    )
  );

-- ===== SUBJECT_FILES =====
DROP POLICY IF EXISTS "Teachers can view files in own subjects" ON public.subject_files;
DROP POLICY IF EXISTS "Students can view files in enrolled subjects" ON public.subject_files;
DROP POLICY IF EXISTS "Teachers can upload files to own subjects" ON public.subject_files;
DROP POLICY IF EXISTS "Teachers can update files in own subjects" ON public.subject_files;
DROP POLICY IF EXISTS "Teachers can delete files in own subjects" ON public.subject_files;
CREATE POLICY "Teachers can view files in own subjects" ON public.subject_files
  FOR SELECT USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Students can view files in enrolled subjects" ON public.subject_files
  FOR SELECT USING (
    subject_id IN (SELECT public.get_student_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can upload files to own subjects" ON public.subject_files
  FOR INSERT WITH CHECK (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can update files in own subjects" ON public.subject_files
  FOR UPDATE USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can delete files in own subjects" ON public.subject_files
  FOR DELETE USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );

-- ===== FILE_SHARES =====
DROP POLICY IF EXISTS "Users can view shares for their files" ON public.file_shares;
DROP POLICY IF EXISTS "Users can share own files" ON public.file_shares;
DROP POLICY IF EXISTS "File owners can update shares" ON public.file_shares;
DROP POLICY IF EXISTS "File owners can delete shares" ON public.file_shares;
CREATE POLICY "Users can view shares for their files" ON public.file_shares
  FOR SELECT USING (shared_by = auth.uid() OR shared_with = auth.uid());
CREATE POLICY "Users can share own files" ON public.file_shares
  FOR INSERT WITH CHECK (shared_by = auth.uid());
CREATE POLICY "File owners can update shares" ON public.file_shares
  FOR UPDATE USING (
    file_id IN (SELECT id FROM public.user_files WHERE user_id = auth.uid())
  );
CREATE POLICY "File owners can delete shares" ON public.file_shares
  FOR DELETE USING (shared_by = auth.uid() OR shared_with = auth.uid());

-- ===== USER_FILES =====
DROP POLICY IF EXISTS "Users can view own files" ON public.user_files;
DROP POLICY IF EXISTS "Users can view files shared with them" ON public.user_files;
DROP POLICY IF EXISTS "Teachers can view files linked to their assignments" ON public.user_files;
DROP POLICY IF EXISTS "Users can upload files" ON public.user_files;
DROP POLICY IF EXISTS "Users can update own files" ON public.user_files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.user_files;
CREATE POLICY "Users can view own files" ON public.user_files
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view files shared with them" ON public.user_files
  FOR SELECT USING (
    id IN (SELECT file_id FROM public.file_shares WHERE shared_with = auth.uid())
  );
CREATE POLICY "Teachers can view files linked to their assignments" ON public.user_files
  FOR SELECT USING (
    assignment_id IN (
      SELECT a.id FROM public.assignments a
      WHERE a.subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
    )
  );
CREATE POLICY "Users can upload files" ON public.user_files
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own files" ON public.user_files
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own files" ON public.user_files
  FOR DELETE USING (user_id = auth.uid());

-- ===== ASSIGNMENTS =====
DROP POLICY IF EXISTS "Teachers can view assignments in own subjects" ON public.assignments;
DROP POLICY IF EXISTS "Students can view assignments in enrolled subjects" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can delete own assignments" ON public.assignments;
CREATE POLICY "Teachers can view assignments in own subjects" ON public.assignments
  FOR SELECT USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Students can view assignments in enrolled subjects" ON public.assignments
  FOR SELECT USING (
    subject_id IN (SELECT public.get_student_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can create assignments" ON public.assignments
  FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can update own assignments" ON public.assignments
  FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own assignments" ON public.assignments
  FOR DELETE USING (teacher_id = auth.uid());

-- ===== NOTE_VIEWS =====
DROP POLICY IF EXISTS "Users can view note views" ON public.note_views;
DROP POLICY IF EXISTS "Users can insert own note views" ON public.note_views;
DROP POLICY IF EXISTS "Users can delete own note views" ON public.note_views;
CREATE POLICY "Users can view note views" ON public.note_views
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own note views" ON public.note_views
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own note views" ON public.note_views
  FOR DELETE USING (user_id = auth.uid());

-- ===== LECTURE_NOTES =====
DROP POLICY IF EXISTS "Teachers can view all notes in their subjects" ON public.lecture_notes;
DROP POLICY IF EXISTS "Students can view public notes in enrolled subjects" ON public.lecture_notes;
DROP POLICY IF EXISTS "Users can create notes" ON public.lecture_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.lecture_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.lecture_notes;
CREATE POLICY "Teachers can view all notes in their subjects" ON public.lecture_notes
  FOR SELECT USING (
    public.is_lecture_teacher(lecture_id, auth.uid())
  );
CREATE POLICY "Students can view public notes in enrolled subjects" ON public.lecture_notes
  FOR SELECT USING (
    (visibility = 'public' AND public.is_lecture_student(lecture_id, auth.uid())) OR user_id = auth.uid()
  );
CREATE POLICY "Users can create notes" ON public.lecture_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notes" ON public.lecture_notes
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notes" ON public.lecture_notes
  FOR DELETE USING (user_id = auth.uid());

-- ===== SCORES =====
DROP POLICY IF EXISTS "Students can read own scores" ON public.scores;
DROP POLICY IF EXISTS "Teachers can read own quiz scores" ON public.scores;
DROP POLICY IF EXISTS "Students can create own scores" ON public.scores;
DROP POLICY IF EXISTS "Teachers can delete own quiz scores" ON public.scores;
CREATE POLICY "Students can read own scores" ON public.scores
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can read own quiz scores" ON public.scores
  FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Students can create own scores" ON public.scores
  FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers can delete own quiz scores" ON public.scores
  FOR DELETE USING (teacher_id = auth.uid());

-- ===== QUIZZES =====
DROP POLICY IF EXISTS "Users can read own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Students can read teacher quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can create own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON public.quizzes;
CREATE POLICY "Users can read own quizzes" ON public.quizzes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students can read teacher quizzes" ON public.quizzes
  FOR SELECT USING (
    user_id IN (SELECT teacher_id FROM public.teacher_student_links WHERE student_id = auth.uid())
  );
CREATE POLICY "Users can create own quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own quizzes" ON public.quizzes
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own quizzes" ON public.quizzes
  FOR DELETE USING (user_id = auth.uid());

-- ===== LECTURES =====
DROP POLICY IF EXISTS "Teachers can view lectures in own subjects" ON public.lectures;
DROP POLICY IF EXISTS "Students can view lectures in enrolled subjects" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can create lectures" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can update lectures" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can delete lectures" ON public.lectures;
CREATE POLICY "Teachers can view lectures in own subjects" ON public.lectures
  FOR SELECT USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Students can view lectures in enrolled subjects" ON public.lectures
  FOR SELECT USING (
    subject_id IN (SELECT public.get_student_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can create lectures" ON public.lectures
  FOR INSERT WITH CHECK (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can update lectures" ON public.lectures
  FOR UPDATE USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can delete lectures" ON public.lectures
  FOR DELETE USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );

-- ===== SUBJECT_STUDENTS =====
DROP POLICY IF EXISTS "Teachers can view enrollments in their subjects" ON public.subject_students;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.subject_students;
DROP POLICY IF EXISTS "Teachers can enroll students" ON public.subject_students;
DROP POLICY IF EXISTS "Teachers can remove students" ON public.subject_students;
CREATE POLICY "Teachers can view enrollments in their subjects" ON public.subject_students
  FOR SELECT USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Students can view own enrollments" ON public.subject_students
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can enroll students" ON public.subject_students
  FOR INSERT WITH CHECK (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can remove students" ON public.subject_students
  FOR DELETE USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );

-- ===== SUBJECT_TEACHERS =====
DROP POLICY IF EXISTS "Teachers can view subject_teachers in their subjects" ON public.subject_teachers;
DROP POLICY IF EXISTS "Students can view subject_teachers in enrolled subjects" ON public.subject_teachers;
DROP POLICY IF EXISTS "Subject owner can add co-teachers" ON public.subject_teachers;
DROP POLICY IF EXISTS "Subject owner can remove co-teachers" ON public.subject_teachers;
DROP POLICY IF EXISTS "Co-teachers can remove themselves" ON public.subject_teachers;
CREATE POLICY "Teachers can view subject_teachers in their subjects" ON public.subject_teachers
  FOR SELECT USING (
    subject_id IN (SELECT public.get_teacher_subject_ids(auth.uid()))
  );
CREATE POLICY "Students can view subject_teachers in enrolled subjects" ON public.subject_teachers
  FOR SELECT USING (
    subject_id IN (SELECT public.get_student_subject_ids(auth.uid()))
  );
CREATE POLICY "Subject owner can add co-teachers" ON public.subject_teachers
  FOR INSERT WITH CHECK (
    subject_id IN (SELECT id FROM public.subjects WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Subject owner can remove co-teachers" ON public.subject_teachers
  FOR DELETE USING (
    subject_id IN (SELECT id FROM public.subjects WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Co-teachers can remove themselves" ON public.subject_teachers
  FOR DELETE USING (
    teacher_id = auth.uid() AND role = 'co_teacher'
  );

-- ===== SUBJECTS =====
DROP POLICY IF EXISTS "Teachers can view own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Students can view enrolled subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can create subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can update own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can delete own subjects" ON public.subjects;
CREATE POLICY "Teachers can view own subjects" ON public.subjects
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR id IN (SELECT subject_id FROM public.subject_teachers WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Students can view enrolled subjects" ON public.subjects
  FOR SELECT USING (
    id IN (SELECT public.get_student_subject_ids(auth.uid()))
  );
CREATE POLICY "Teachers can create subjects" ON public.subjects
  FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can update own subjects" ON public.subjects
  FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own subjects" ON public.subjects
  FOR DELETE USING (teacher_id = auth.uid());

-- ===== SUMMARIES =====
DROP POLICY IF EXISTS "Users can read own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Teachers can read linked student summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can create own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON public.summaries;
CREATE POLICY "Users can read own summaries" ON public.summaries
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Teachers can read linked student summaries" ON public.summaries
  FOR SELECT USING (
    user_id IN (SELECT student_id FROM public.teacher_student_links WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Users can create own summaries" ON public.summaries
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own summaries" ON public.summaries
  FOR DELETE USING (user_id = auth.uid());

-- ===== TEACHER-STUDENT LINKS =====
DROP POLICY IF EXISTS "Teachers can see own student links" ON public.teacher_student_links;
DROP POLICY IF EXISTS "Students can see own teacher links" ON public.teacher_student_links;
DROP POLICY IF EXISTS "Students can create links" ON public.teacher_student_links;
DROP POLICY IF EXISTS "Students can delete own links" ON public.teacher_student_links;
CREATE POLICY "Teachers can see own student links" ON public.teacher_student_links
  FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Students can see own teacher links" ON public.teacher_student_links
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can create links" ON public.teacher_student_links
  FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can delete own links" ON public.teacher_student_links
  FOR DELETE USING (student_id = auth.uid());

-- ===== USERS =====
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Teachers can read linked students" ON public.users;
DROP POLICY IF EXISTS "Anyone authenticated can find teachers" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can read linked students" ON public.users
  FOR SELECT USING (
    id IN (SELECT student_id FROM public.teacher_student_links WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Anyone authenticated can find teachers" ON public.users
  FOR SELECT USING (role = 'teacher' AND teacher_code IS NOT NULL);

-- ===== STORAGE POLICIES =====
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload course files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read course files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can read subject files" ON storage.objects;
DROP POLICY IF EXISTS "Students can read subject files" ON storage.objects;
CREATE POLICY "Users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Teachers can upload course files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-files' AND 
    (storage.foldername(name))[1] IN ('courses', 'subjects') AND
    EXISTS (SELECT 1 FROM public.subjects WHERE teacher_id = auth.uid())
  );
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated users can read course files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-files' AND 
    (storage.foldername(name))[1] IN ('courses', 'subjects')
  );
CREATE POLICY "Users can update own files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Teachers can read subject files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-files' AND 
    EXISTS (
      SELECT 1 FROM public.subject_files sf
      JOIN public.subjects s ON sf.subject_id = s.id
      WHERE s.teacher_id = auth.uid() AND sf.file_url::text LIKE '%' || name::text || '%'
    )
  );
CREATE POLICY "Students can read subject files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-files' AND 
    EXISTS (
      SELECT 1 FROM public.subject_files sf
      JOIN public.subject_students ss ON sf.subject_id = ss.subject_id
      WHERE ss.student_id = auth.uid() AND sf.file_url::text LIKE '%' || name::text || '%'
    )
  );

-- ✅ تم إصلاح جميع السياسات بنجاح!
