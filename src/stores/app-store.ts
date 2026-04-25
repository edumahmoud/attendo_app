import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppPage, StudentSection, TeacherSection, AdminSection, CourseTab } from '@/lib/types';

interface AppState {
  // Navigation
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  
  // Profile page navigation
  profileUserId: string | null;
  setProfileUserId: (id: string | null) => void;
  openProfile: (userId: string, tab?: string) => void;
  profileTab: string;
  setProfileTab: (tab: string) => void;
  
  // Student navigation
  studentSection: StudentSection;
  setStudentSection: (section: StudentSection) => void;
  
  // Teacher navigation
  teacherSection: TeacherSection;
  setTeacherSection: (section: TeacherSection) => void;
  
  // Admin navigation
  adminSection: AdminSection;
  setAdminSection: (section: AdminSection) => void;
  
  // Quiz/Summary viewing
  viewingQuizId: string | null;
  setViewingQuizId: (id: string | null) => void;
  
  viewingSummaryId: string | null;
  setViewingSummaryId: (id: string | null) => void;
  
  // Course page navigation
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  
  courseTab: CourseTab;
  setCourseTab: (tab: CourseTab) => void;
  
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Chat unread count
  totalChatUnread: number;
  setTotalChatUnread: (count: number) => void;
  courseChatUnread: number;
  setCourseChatUnread: (count: number) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  currentPage: 'auth' as AppPage,
  profileUserId: null as string | null,
  profileTab: 'files' as string,
  studentSection: 'dashboard' as StudentSection,
  teacherSection: 'dashboard' as TeacherSection,
  adminSection: 'dashboard' as AdminSection,
  viewingQuizId: null as string | null,
  viewingSummaryId: null as string | null,
  selectedSubjectId: null as string | null,
  courseTab: 'overview' as CourseTab,
  selectedStudentId: null as string | null,
  sidebarOpen: false,
  totalChatUnread: 0,
  courseChatUnread: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setCurrentPage: (page) => set({ currentPage: page }),
      setProfileUserId: (id) => set({ profileUserId: id }),
      openProfile: (userId, tab) => set({ profileUserId: userId, currentPage: 'profile', ...(tab ? { profileTab: tab } : {}) }),
      setProfileTab: (tab) => set({ profileTab: tab }),
      setStudentSection: (section) => set({ studentSection: section }),
      setTeacherSection: (section) => set({ teacherSection: section }),
      setAdminSection: (section) => set({ adminSection: section }),
      setViewingQuizId: (id) => set({ viewingQuizId: id, currentPage: id ? 'quiz' : get().currentPage }),
      setViewingSummaryId: (id) => set({ viewingSummaryId: id, currentPage: id ? 'summary' : get().currentPage }),
      setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),
      setCourseTab: (tab) => set({ courseTab: tab }),
      setSelectedStudentId: (id) => set({ selectedStudentId: id }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTotalChatUnread: (count) => set({ totalChatUnread: count }),
      setCourseChatUnread: (count) => set({ courseChatUnread: count }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'attendo-app-store',
      partialize: (state) => ({
        studentSection: state.studentSection,
        teacherSection: state.teacherSection,
        adminSection: state.adminSection,
        currentPage: state.currentPage,
        selectedSubjectId: state.selectedSubjectId,
        courseTab: state.courseTab,
        profileTab: state.profileTab,
      }),
    }
  )
);
