import React from 'react';
import { Link } from 'react-router'; 
import useAuthStore from '../../stores/useAuthStore';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FileSignature, 
  PlusCircle, 
  Search,
  BookOpen,
  BarChart3
} from 'lucide-react';

// dashboard stats are computed below (after mock lists are defined)

const activeClasses = [
  { id: 1, name: "Lập trình Web Nâng cao", code: "CS402", students: 45, progress: 60, image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80" },
  { id: 2, name: "Cơ sở dữ liệu", code: "CS201", students: 60, progress: 45, image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80" },
  { id: 3, name: "Đồ án tốt nghiệp", code: "CS500", students: 40, progress: 80, image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80" },
];

// Danh sách Grade Items (Bài tập/Đầu điểm)
const gradeItems = [
  { id: 1, title: "Bài tập lớn: E-commerce App", course: "Lập trình Web", deadline: "20/11/2025", submitted: 40, total: 45, status: "Open" },
  { id: 2, title: "Kiểm tra giữa kỳ", course: "Cơ sở dữ liệu", deadline: "15/11/2025", submitted: 60, total: 60, status: "Grading" },
  { id: 3, title: "Báo cáo tiến độ tuần 5", course: "Đồ án tốt nghiệp", deadline: "22/11/2025", submitted: 12, total: 40, status: "Open" },
];

// Danh sách sinh viên vừa nộp bài cần chấm
const recentSubmissions = [
  { id: 1, student: "Trần Thị B", task: "E-commerce App", time: "10 phút trước", status: "pending" },
  { id: 2, student: "Lê Văn C", task: "E-commerce App", time: "1 giờ trước", status: "pending" },
  { id: 3, student: "Nguyễn Văn A", task: "E-commerce App", time: "2 giờ trước", status: "pending" },
  { id: 4, student: "Phạm Minh D", task: "Kiểm tra giữa kỳ", time: "Hôm qua", status: "reviewed" },
];

// compute stats from mock data so values remain consistent
const totalStudents = activeClasses.reduce((sum, c) => sum + (c.students || 0), 0);
const pendingSubmissionsCount = recentSubmissions.filter((s) => s.status === 'pending').length;
const classesCount = activeClasses.length;
const stats = [
  { id: 1, label: "Tổng sinh viên", value: totalStudents, icon: Users, color: "bg-blue-500" },
  { id: 2, label: "Bài cần chấm", value: pendingSubmissionsCount, icon: FileSignature, color: "bg-orange-500" },
  { id: 3, label: "Lớp đang dạy", value: classesCount, icon: BookOpen, color: "bg-purple-500" },
  { id: 4, label: "Điểm trung bình", value: '-', icon: BarChart3, color: "bg-green-500" },
];

const TeacherDashboard: React.FC = () => {
  // 1. Lấy user từ useAuthStore
  const user = useAuthStore((state) => state.user);

  // 2. Xử lý hiển thị tên
  const displayName = user 
    ? `${(user as any).firstName ?? user.fistName ?? ''} ${(user as any).lastName ?? user.lastName ?? ''}`.trim() || user.username 
    : "Giảng viên";

  // 3. Xử lý Role hiển thị
  const displayRole = (user as any)?.roleName || "TEACHER";


  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
        
      {/* HEADER / NAVBAR */}
      <nav className="sticky top-0 z-9 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg">
            <LayoutDashboard size={20} />
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block tracking-tight">
            Teacher Portal
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search bar nhỏ */}
          <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="Tìm sinh viên, lớp học..." className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-48 dark:text-white placeholder-gray-400" />
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{displayRole}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Tổng quan</h1>
              <p className="text-gray-500 dark:text-gray-400">Chào mừng thầy/cô quay trở lại làm việc.</p>
            </div>
            <button className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md">
              <PlusCircle size={18} /> Tạo khóa học mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`p-4 rounded-2xl text-white ${stat.color} shadow-lg shadow-opacity-20`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col (2/3): Grade Items & Management */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Action Card */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 transform skew-x-12"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                      <h3 className="text-2xl font-bold mb-2">Quản lý Grade Items</h3>
                      <p className="text-indigo-100">Tạo bài tập, quiz hoặc cột điểm mới cho các lớp học của bạn một cách dễ dàng.</p>
                  </div>
                  <div className="flex gap-3">
                      <Link to="/grade-items" className="bg-white text-indigo-600 px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2">
                          <ClipboardList size={20} />
                          Quản lý ngay
                      </Link>
                  </div>
                </div>
            </section>

            {/* Grade Items List */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                  <ClipboardList className="text-indigo-500" size={20}/> Các đầu điểm đang hoạt động
                </h3>
                <Link to="/grade-items" className="text-sm text-indigo-600 hover:underline">Xem tất cả</Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {gradeItems.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.course}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Grading' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                          {item.status === 'Grading' ? 'Đang chấm' : 'Đang mở'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <div className="w-full max-w-md mr-4">
                          <div className="flex justify-between text-xs mb-1 text-gray-500">
                              <span>Tiến độ nộp bài</span>
                              <span>{item.submitted}/{item.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{width: `${(item.submitted/item.total)*100}%`}}></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <FileSignature size={14} /> Deadline: {item.deadline}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active Classes (Horizontal Scroll on mobile) */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Khóa học đang phụ trách</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeClasses.map(course => (
                      <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-500 transition-colors cursor-pointer">
                          <div className="h-32 rounded-lg bg-gray-200 mb-4 overflow-hidden relative">
                              <img src={course.image} alt="cover" className="w-full h-full object-cover" />
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">{course.code}</div>
                          </div>
                          <h4 className="font-bold text-gray-900 dark:text-white truncate">{course.name}</h4>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Users size={12}/> {course.students} SV</span>
                              <span>{course.progress}% Giáo trình</span>
                          </div>
                      </div>
                  ))}
              </div>
            </section>
          </div>

          {/* Right Col (1/3): Grading & Needs Attention */}
          <div className="space-y-8">
            
            {/* Needs Grading Box */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                      <FileSignature size={20} className="text-orange-500" /> Cần chấm điểm
                  </h3>
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-full">{pendingSubmissionsCount} mới</span>
                </div>
                
                <div className="space-y-4">
                  {recentSubmissions.map((sub) => (
                      <div key={sub.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold">
                              {sub.student.charAt(0)}
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{sub.student}</h4>
                                  <span className="text-[10px] text-gray-400">{sub.time}</span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">Nộp: {sub.task}</p>
                              <div className="mt-2">
                                  <Link to="/student-grades" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1">
                                      Chấm ngay <FileSignature size={12}/>
                                  </Link>
                              </div>
                          </div>
                      </div>
                  ))}
                </div>

                <Link 
                  to="/student-grades" 
                  className="mt-6 block w-full py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-center text-sm font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  Vào sổ điểm (Student Grades)
                </Link>
            </section>

            {/* Class Quick Stats */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Thống kê nhanh</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Điểm trung bình (Web)</span>
                      <span className="font-bold text-green-500">8.2</span>
                  </li>
                  <li className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sinh viên cảnh báo</span>
                      <span className="font-bold text-red-500">5</span>
                  </li>
                  <li className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tỷ lệ nộp bài đúng hạn</span>
                      <span className="font-bold text-blue-500">92%</span>
                  </li>
                </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;