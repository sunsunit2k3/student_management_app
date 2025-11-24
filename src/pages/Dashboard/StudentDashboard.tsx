import React from 'react';
import { Link } from 'react-router'; // Hoặc 'react-router-dom' tùy setup dự án
import useAuthStore from "../../stores/useAuthStore"; // Đảm bảo đường dẫn đúng đến store của bạn
import { useEffect, useState } from 'react';
import { getEnrollmentsByUser } from '../../api/enrollmentService';
import { getStudentGradesByStudentId } from '../../api/studentGradeService';
import { getGradeItemByStudentId } from '../../api/gradeItemService';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';
import { 
  EnrollmentResponseDto,
  GradeItemResponseDto, 
  StudentGradeResponseDto 
} from '../../types';

const stats = [
  { id: 1, label: "Khóa học đang học", value: "4", icon: BookOpen, color: "bg-brand-500" },
  { id: 2, label: "Bài tập chờ nộp", value: "2", icon: Clock, color: "bg-warning-500" },
  { id: 3, label: "Điểm trung bình", value: "3.8", icon: TrendingUp, color: "bg-success-500" },
  { id: 4, label: "Tổng tín chỉ", value: "120", icon: CheckCircle, color: "bg-theme-purple-500" },
];

// placeholder initial values
const initialCourses: EnrollmentResponseDto[] = [];
const initialAssignments: GradeItemResponseDto[] = [];
const initialGrades: StudentGradeResponseDto[] = [];

const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const displayName = user 
    ? `${(user as any).firstName ?? user.fistName ?? ''} ${(user as any).lastName ?? user.lastName ?? ''}`.trim() || user.username 
    : "Sinh viên";

  const [coursesState, setCoursesState] = useState<EnrollmentResponseDto[]>(initialCourses);
  const [gradesState, setGradesState] = useState<StudentGradeResponseDto[]>(initialGrades);
  const [assignmentsState, setAssignmentsState] = useState<GradeItemResponseDto[]>(initialAssignments);
  const [gradeItemMap, setGradeItemMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // derive quick stat values to avoid unused var lint and show live stats
  const coursesCount = coursesState.length;
  const pendingCount = assignmentsState.length;
  const avgGrade = gradesState.length > 0 
    ? (gradesState.reduce((s, g) => s + Number(g.score || 0), 0) / gradesState.length).toFixed(1) 
    : '0.0';
  const totalCredits = 0; 

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1) Enrollments for current user (used to show enrolled courses)
        if (user?.id) {
          const enrollResp = await getEnrollmentsByUser(String(user.id));
          const enrollments: EnrollmentResponseDto[] = enrollResp?.data ?? [];
          // sort by createdAt desc and keep 5 most recent
          const sortedEnrollments = enrollments
            .slice()
            .sort((a, b) => {
              const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return tb - ta;
            })
            .slice(0, 5);

          setCoursesState(sortedEnrollments.length > 0 ? sortedEnrollments : initialCourses);

          // 2) Grades for current user (raw list)
          const gradesResp = await getStudentGradesByStudentId(String(user.id));
          const grades: StudentGradeResponseDto[] = gradesResp?.data ?? [];
          
          // Build a map keyed by gradeItemId for quick lookup of submission status
          const gmap: Record<string, StudentGradeResponseDto> = {};
          grades.forEach((gr) => {
            if (gr.gradeItemId) gmap[gr.gradeItemId] = gr;
          });

          // Set recent grades (top 5)
          setGradesState(grades.slice(0, 5));

          // 3) Grade items (assignments) by user -> show upcoming (due in future) and not submitted
          const gradeItemsResp = await getGradeItemByStudentId(String(user.id));
          const gradeItems: GradeItemResponseDto[] = gradeItemsResp?.data ?? [];
          // build a map of gradeItemId -> name for rendering recent grades
          const gim: Record<string, string> = {};
          gradeItems.forEach((it) => {
            if (it && it.id) gim[it.id] = it.name ?? '';
          });
          setGradeItemMap(gim);
          const now = new Date();
          
          const upcoming = gradeItems
            .filter((it) => {
              const due = it.dueDate ? new Date(it.dueDate) : null;
              // keep only items with a due date in the future
              if (!due || due < now) return false;
              // check submission status from grade map
              const submitted = gmap[it.id]?.isSubmitted === true;
              return !submitted;
            })
            // sort newest-first by dueDate
            .sort((a, b) => {
              const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
              const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
              return dateB - dateA;
            });

          setAssignmentsState(upcoming.slice(0, 6));
        }
      } catch (err: any) {
        console.error('Dashboard load error', err);
        setError(err?.message || 'Không tải được dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  // helper: create initials from course title
  const getInitials = (text?: string) => {
    if (!text) return 'KH';
    const parts = text.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-outfit">
        
      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* 1. Welcome Section */}
        <section>
          <h2 className="text-title-md font-bold mb-1 text-gray-900 dark:text-white">Xin chào, {displayName}! 👋</h2>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Mã sinh viên: <span className="font-medium text-gray-700 dark:text-gray-300">{user?.id || "SV2024..."}</span>
          </p>
          <p className="text-theme-sm text-gray-400 mt-1">Đây là tổng quan tình hình học tập của bạn.</p>
        </section>

        {/* Loading / Error */}
        {loading && (
          <div className="p-4 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30">Đang tải dữ liệu...</div>
        )}
        {error && (
          <div className="p-4 rounded-lg bg-error-50 text-error-700 dark:bg-error-900/30">Lỗi: {error}</div>
        )}

        {/* 2. Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-800 transform transition duration-300 hover:scale-105 hover:shadow-theme-md">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-brand-500/20`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full">HK 1 - 2025</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.id === 1 ? coursesCount : stat.id === 2 ? pendingCount : stat.id === 3 ? avgGrade : totalCredits}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* 3. Dashboard Main Area: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2/3): Courses */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* My Courses Section */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <BookOpen size={20} className="text-brand-500" /> Lớp học của tôi
                </h3>
                <Link to="/courses" className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">Xem tất cả</Link>
              </div>
              
              <div className="space-y-4">
                {coursesState.map((enrollment) => (
                  <Link key={enrollment.id} to={`/student/detail/${enrollment.courseId}`} className="block">
                    <div className="group bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-800 flex items-center gap-4 transform transition duration-300 hover:scale-105 hover:border-brand-500">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-brand-100 to-brand-300 text-white text-lg font-bold flex-shrink-0">
                        <span className="text-white">{getInitials(enrollment.courseName ?? 'KH')}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-brand-600 line-clamp-2">{enrollment.courseName ?? 'Khóa học'}</h4>
                        <p className="text-xs text-gray-500 mt-1">{enrollment.userName ?? ''}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            
            {/* ...existing code... (CTA section removed) */}
          </div>

          {/* Right Column (1/3): Tasks & Grades */}
          <div className="space-y-8">
            
            {/* Upcoming Deadlines */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Clock size={20} className="text-warning-500" /> Nhiệm vụ sắp tới
              </h3>
              <div className="space-y-4">
                {assignmentsState.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 transform transition duration-300 hover:scale-105">
                    <div className="mt-1 w-2 h-2 rounded-full bg-error-500 animate-pulse"></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Course {item.courseId}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded w-fit text-error-600 bg-error-50 dark:bg-error-500/10">
                         <AlertCircle size={12} />
                         {item.dueDate ? new Date(item.dueDate).toLocaleString() : 'Chưa có'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <Link to="/submission-files" className="text-sm text-brand-600 hover:underline font-medium">Xem tất cả bài tập</Link>
              </div>
            </section>

            {/* Recent Grades */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <TrendingUp size={20} className="text-success-500" /> Điểm số mới nhất
              </h3>
              <ul className="space-y-3">
                {gradesState.map((grade) => (
                  <li key={grade.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transform transition duration-300 hover:scale-105">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{(gradeItemMap[grade.gradeItemId] && gradeItemMap[grade.gradeItemId].trim()) ? gradeItemMap[grade.gradeItemId] : 'Bài tập'}</p>
                      <p className="text-xs text-gray-500">{grade.updatedAt ? new Date(grade.updatedAt).toLocaleDateString() : ''}</p>
                    </div>
                    <div className={`text-lg font-bold ${(grade.score ?? 0) >= 9 ? 'text-success-500' : (grade.score ?? 0) >= 7 ? 'text-brand-500' : 'text-warning-500'}`}>
                      {grade.score ?? 0}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                  <Link 
                   to="/student/assignments" 
                   className="block w-full text-center py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-200 dark:hover:border-brand-800"
                  >
                    Xem bảng điểm chi tiết
                  </Link>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;