import React, { useState } from 'react';
import { Link } from 'react-router'; // Lưu ý: dùng 'react-router-dom' nếu bạn dùng bản v6
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp, 
  AlertCircle
} from 'lucide-react';

const currentUser = {
  name: "Nguyễn Văn A",
  studentId: "SV2024001",
  avatar: "https://i.pravatar.cc/150?img=11"
};

const stats = [
  { id: 1, label: "Khóa học đang học", value: "4", icon: BookOpen, color: "bg-blue-500" },
  { id: 2, label: "Bài tập chờ nộp", value: "2", icon: Clock, color: "bg-yellow-500" },
  { id: 3, label: "Điểm trung bình", value: "3.8", icon: TrendingUp, color: "bg-green-500" },
  { id: 4, label: "Tổng tín chỉ", value: "120", icon: CheckCircle, color: "bg-purple-500" },
];

const courses = [
  { 
    id: 1, 
    title: "Lập trình ReactJS Nâng cao", 
    instructor: "Cô Đặng Thu Thảo", 
    progress: 75, 
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 2, 
    title: "UI/UX Design Fundamentals", 
    instructor: "Thầy Trần Minh", 
    progress: 40, 
    image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  { 
    id: 3, 
    title: "Cấu trúc dữ liệu & Giải thuật", 
    instructor: "Thầy Lê Văn B", 
    progress: 90, 
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
];

const assignments = [
  { id: 1, title: "Xây dựng Todo App với Redux", course: "ReactJS Nâng cao", due: "Hôm nay, 23:59", status: "pending" },
  { id: 2, title: "Phân tích User Persona", course: "UI/UX Design", due: "20/11/2025", status: "pending" },
  { id: 3, title: "Bài tập cây nhị phân", course: "Cấu trúc dữ liệu", due: "Đã nộp", status: "submitted" },
];

const recentGrades = [
  { id: 1, subject: "Nhập môn Lập trình", grade: 9.5, date: "15/10/2025" },
  { id: 2, subject: "Cơ sở dữ liệu", grade: 8.0, date: "10/10/2025" },
  { id: 3, subject: "Mạng máy tính", grade: 8.5, date: "05/10/2025" },
];


const StudentDashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    // Wrapper chính giả lập Theme container
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen w-full`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto p-6 space-y-8">
          
          {/* 1. Welcome Section */}
          <section>
            <h2 className="text-3xl font-bold mb-1">Xin chào, {currentUser.name}! 👋</h2>
            <p className="text-gray-500 dark:text-gray-400">Đây là tổng quan tình hình học tập của bạn.</p>
          </section>

          {/* 2. Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-opacity-30`}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">HK 1 - 2025</span>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
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
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-500" /> Khóa học của tôi
                  </h3>
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Xem tất cả</button>
                </div>
                
                <div className="grid gap-4">
                  {courses.map((course) => (
                    <div key={course.id} className="group bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 items-center hover:border-blue-500 transition-colors">
                      <div className="w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{course.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{course.instructor}</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">{course.progress}% hoàn thành</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Shortcut Links Area */}
              <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Bạn cần nộp bài tập?</h3>
                    <p className="text-indigo-100 text-sm">Đừng bỏ lỡ deadline quan trọng nhé.</p>
                  </div>
                  <Link 
                    to="/submission-files" 
                    className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold shadow-md hover:bg-indigo-50 transition-colors flex items-center gap-2"
                  >
                    <FileText size={18} />
                    Nộp bài ngay
                  </Link>
                </div>
              </section>
            </div>

            {/* Right Column (1/3): Tasks & Grades */}
            <div className="space-y-8">
              
              {/* Upcoming Deadlines */}
              <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-yellow-500" /> Nhiệm vụ sắp tới
                </h3>
                <div className="space-y-4">
                  {assignments.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                      <div className={`mt-1 w-2 h-2 rounded-full ${task.status === 'pending' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{task.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{task.course}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded w-fit">
                           {task.due === 'Đã nộp' ? <CheckCircle size={12}/> : <AlertCircle size={12} />}
                           {task.due}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                  <Link to="/submission-files" className="text-sm text-blue-600 hover:underline font-medium">Xem tất cả bài tập</Link>
                </div>
              </section>

              {/* Recent Grades */}
              <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-500" /> Điểm số mới nhất
                </h3>
                <ul className="space-y-3">
                  {recentGrades.map((grade) => (
                    <li key={grade.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{grade.subject}</p>
                        <p className="text-xs text-gray-500">{grade.date}</p>
                      </div>
                      <div className={`text-lg font-bold ${grade.grade >= 9 ? 'text-green-500' : grade.grade >= 7 ? 'text-blue-500' : 'text-yellow-500'}`}>
                        {grade.grade}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                   <Link 
                    to="/student-grades" 
                    className="block w-full text-center py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                   >
                     Xem bảng điểm chi tiết
                   </Link>
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;