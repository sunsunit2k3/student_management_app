import React, { useEffect, useState } from 'react';
import { Link } from 'react-router'; // Hoặc 'react-router-dom'
import { 
  BookOpen, 
  Calendar, 
  Search, 
  MoreVertical, 
  ArrowRight,
  Filter,
  GraduationCap,
  ChevronDown,
  User 
} from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';
import { EnrollmentResponseDto } from '../../types/enrollment';
import { toast } from 'react-toastify';
import { getEnrollmentsByUser } from '../../api/enrollmentService';
import { getCourseById } from '../../api/coursesService'; 
import { isSuccessResponse } from '../../types';

type EnrichedEnrollment = EnrollmentResponseDto & { teacherName?: string };

const StudentClasses: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [enrollments, setEnrollments] = useState<EnrichedEnrollment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(10); 

  useEffect(() => {
    const fetchEnrollmentsAndCourseDetails = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await getEnrollmentsByUser(user.id);
        
        if (isSuccessResponse(response) && response.data) {
          const rawEnrollments = response.data;
          const enrichedData = await Promise.all(
            rawEnrollments.map(async (enrollment) => {
              try {
                if (!enrollment.courseId) return enrollment;
                const courseRes = await getCourseById(enrollment.courseId);
                
                if (isSuccessResponse(courseRes) && courseRes.data) {
                  return {
                    ...enrollment,
                    teacherName: courseRes.data.teacherName || "Chưa cập nhật"
                  };
                }
              } catch (err) {
                console.warn(`Failed to fetch details for course ${enrollment.courseId}`, err);
              }
              return enrollment; 
            })
          );

          setEnrollments(enrichedData);
        }
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
        toast.error("Không thể tải danh sách lớp học.");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollmentsAndCourseDetails();
  }, [user?.id]);

  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  const filteredEnrollments = enrollments.filter(item => 
    item.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedEnrollments = filteredEnrollments.slice(0, visibleCount);

  const getGradientClass = (id: string) => {
    const gradients = [
      "from-blue-500 to-cyan-400",
      "from-purple-500 to-pink-400",
      "from-emerald-500 to-teal-400",
      "from-orange-500 to-amber-400",
      "from-indigo-500 to-violet-400",
      "from-rose-500 to-red-400",
      "from-fuchsia-600 to-purple-500",
      "from-sky-500 to-indigo-500",
    ];
    const safeId = id || "default"; 
    const index = safeId.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="text-blue-600" /> Lớp học của tôi
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Quản lý và theo dõi tiến độ các khóa học bạn đã đăng ký.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm khóa học..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64 shadow-sm transition-all"
              />
            </div>
            <button className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT SECTION */}
        {loading ? (
          // SKELETON LOADING
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse h-64">
                <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded-xl mb-4"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-6 w-3/4 rounded mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/2 rounded mb-6"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-10 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredEnrollments.length === 0 ? (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-4">
              <BookOpen size={48} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa tìm thấy khóa học nào</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              {searchTerm ? `Không có kết quả cho "${searchTerm}"` : "Bạn chưa đăng ký khóa học nào. Hãy khám phá thư viện ngay!"}
            </p>
            <Link to="/courses" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/30">
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          // GRID DISPLAY
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedEnrollments.map((enrollment) => (
                <div 
                  key={enrollment.id} 
                  className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  {/* Colored Header with Icon */}
                  <div className={`h-32 bg-gradient-to-br ${getGradientClass(enrollment.courseId)} p-6 flex items-center justify-center relative`}>
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
                      <GraduationCap className="text-white drop-shadow-md" size={36} />
                    </div>
                    
                    {/* Menu Icon */}
                    <div className="absolute top-3 right-3 bg-black/10 hover:bg-black/20 p-1.5 rounded-lg cursor-pointer transition-colors text-white">
                       <MoreVertical size={16} />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/90 text-gray-800 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Đang học
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-5 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors mb-2 min-h-[3.5rem]">
                        {enrollment.courseName || "Chưa có tên khóa học"}
                      </h3>
                      
                      <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {/* Teacher Name Display */}
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-blue-500" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            GV: {enrollment.teacherName || "Đang cập nhật..."}
                          </span>
                        </div>

                        {/* Enrollment Date */}
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          <span>Đăng ký: {formatDate(enrollment.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Link 
                        to={`/student/detail/${enrollment.courseId}`} 
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                      >
                        Vào lớp học
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredEnrollments.length && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300"
                >
                  Xem thêm {filteredEnrollments.length - visibleCount} khóa học
                  <ChevronDown size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentClasses;