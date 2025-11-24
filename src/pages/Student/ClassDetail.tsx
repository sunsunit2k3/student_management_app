import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router'; 
import { 
  ArrowLeft, Users, BookOpen, GraduationCap, Mail, Search,
  MoreVertical, Calendar, Award, FileText, Clock, Percent, 
  X, Upload, CheckCircle, Loader2, FileCheck
} from 'lucide-react';
import SubmissionModal from '../../components/modals/SubmissionModal';
import { toast } from 'react-toastify';

import { getCourseById } from '../../api/coursesService';
import { getEnrollmentsByCourse, getEnrollmentsByUser } from '../../api/enrollmentService';
import { getGradeItemsByCourse } from '../../api/gradeItemService'; 
import { uploadFile } from '../../api/submissionFileService';
import { 
    createStudentGrade, 
    getGradesByEnrollment, 
    updateStudentGrade 
} from '../../api/studentGradeService';

import { CourseResponseDto } from '../../types/course';
import { GradeItemResponseDto } from '../../types/gradeitem';
import { StudentGradeResponseDto } from '../../types/studentgrade';
import { UserResponseDto } from '../../types/user'; 
import useAuthStore from '../../stores/useAuthStore';

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [course, setCourse] = useState<CourseResponseDto | null>(null);
  
  const [students, setStudents] = useState<UserResponseDto[]>([]);
  
  const [gradeItems, setGradeItems] = useState<GradeItemResponseDto[]>([]);
  const [myGrades, setMyGrades] = useState<StudentGradeResponseDto[]>([]);
  const [myEnrollmentId, setMyEnrollmentId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'people' | 'overview' | 'grades'>('people');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [selectedItem, setSelectedItem] = useState<GradeItemResponseDto | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        toast.error("Không tìm thấy ID lớp học");
        return;
      }
      try {
        setLoading(true);
        
        const [courseRes, usersRes, gradesRes] = await Promise.all([
          getCourseById(id),
          getEnrollmentsByCourse(id), 
          getGradeItemsByCourse(id)
        ]);

        const courseData = (courseRes as any)?.data || courseRes; 
        setCourse(courseData);
        const usersData = (usersRes as any)?.data || usersRes;
        const userList = Array.isArray(usersData) ? usersData : (usersData?.content || []);
        setStudents(userList);
        const gradesData = (gradesRes as any)?.data || gradesRes;
        setGradeItems(Array.isArray(gradesData) ? gradesData : []);
        if (user) {
            try {
                const myEnrollmentsRes = await getEnrollmentsByUser(user.id);
                const myEnrollments = (myEnrollmentsRes as any)?.data || myEnrollmentsRes;
                const currentEnrollment = Array.isArray(myEnrollments) 
                    ? myEnrollments.find((e: any) => e.courseId === id || e.course?.id === id)
                    : null;
                if (currentEnrollment) {
                    setMyEnrollmentId(currentEnrollment.id);
                    const myGradesRes = await getGradesByEnrollment(currentEnrollment.id);
                    const myGradesData = (myGradesRes as any)?.data || myGradesRes;
                    setMyGrades(Array.isArray(myGradesData) ? myGradesData : []);
                }
            } catch (err) {
                console.error("Lỗi tải thông tin cá nhân trong lớp", err);
            }
        }

      } catch (error: any) {
        const mess = error?.response?.data?.message || error.message || "Lỗi khi tải dữ liệu.";
        toast.error(mess);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);


  // Submission handled via SubmissionModal

  const getMyGradeInfo = (gradeItemId: string) => {
      return myGrades.find(g => g.gradeItemId === gradeItemId);
  };

  // Handler exposed to SubmissionModal: creates/updates studentGrade, uploads file, refreshes grades
  const handleSubmitFromModal = async (file: File): Promise<string | void> => {
    if (!selectedItem) {
      toast.error('Không tìm thấy bài tập đã chọn.');
      return;
    }
    if (!myEnrollmentId) {
      toast.error('Không tìm thấy thông tin tham gia lớp học (Enrollment ID). Vui lòng tải lại trang.');
      return;
    }

    try {
      let currentGrade = getMyGradeInfo(selectedItem.id);
      let studentGradeId = currentGrade?.id;

      if (!studentGradeId) {
        const createPayload = {
          enrollmentId: myEnrollmentId,
          gradeItemId: selectedItem.id,
          score: null,
          isSubmitted: true,
        };

        const res = await createStudentGrade(createPayload);
        const newGradeRecord = (res as any)?.data || res;
        studentGradeId = newGradeRecord.id;

        setMyGrades(prev => [...prev, newGradeRecord]);
      } else {
        await updateStudentGrade(studentGradeId, { id: studentGradeId, isSubmitted: true });
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentGradeId', studentGradeId as string);

      await uploadFile(formData);

      toast.success('Nộp bài thành công!');

      // refresh grades list for this enrollment
      if (myEnrollmentId) {
        const res = await getGradesByEnrollment(myEnrollmentId);
        const gradesData = (res as any)?.data || res;
        setMyGrades(Array.isArray(gradesData) ? gradesData : []);
      }

      // return the studentGradeId so modal can refresh attached files
      return studentGradeId;
    } catch (error: any) {
      const mess = error?.response?.data?.message || 'Lỗi khi nộp bài.';
      toast.error(mess);
      throw error;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Không có hạn";
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  // 4. SỬA HELPER FUNCTION: Cập nhật để đọc dữ liệu từ UserResponseDto
  const getStudentName = (u: UserResponseDto) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    return u.username || "Ẩn danh";
  };
  
  const getStudentEmail = (u: UserResponseDto) => u.email || "";
  
  const filteredStudents = students.filter(s => 
    getStudentName(s).toLowerCase().includes(searchTerm.toLowerCase()) || 
    getStudentEmail(s).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Submission modal is rendered below using SubmissionModal component

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
             <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4"/>
             <p className="text-gray-500">Đang tải dữ liệu lớp học...</p>
          </div>
      </div>
    );
  }

  if (!course) return (
    <div className="text-center mt-20">
        <h2 className="text-xl text-gray-600">Không tìm thấy thông tin lớp học.</h2>
        <Link to="/" className="text-blue-500 hover:underline mt-2 block">Quay lại trang chủ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <SubmissionModal
        isOpen={!!selectedItem}
        selectedItem={selectedItem}
        myGrade={selectedItem ? getMyGradeInfo(selectedItem.id) : undefined}
        onClose={() => setSelectedItem(null)}
        onSubmit={handleSubmitFromModal}
      />
      
      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <Link to="/student/classes" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-4">
              <ArrowLeft size={20} className="mr-2" />
              Quay lại danh sách
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    Mã lớp: {course.code}
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <Calendar size={16} />
                    {course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                 <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <MoreVertical size={20} />
                 </button>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700 mt-4">
            {[
              { id: 'people', label: 'Mọi người', icon: Users },
              { id: 'overview', label: 'Bảng tin', icon: BookOpen },
              { id: 'grades', label: 'Bài tập & Điểm', icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* TAB: MỌI NGƯỜI */}
        {activeTab === 'people' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            <div className="lg:col-span-3">
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                Giáo viên <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Owner</span>
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-900/30 p-4 flex items-center gap-4 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {course.teacherName ? course.teacherName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {course.teacherName || "Chưa cập nhật tên"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Mail size={14} /> Giáo viên chủ nhiệm
                  </p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-3 mt-8">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Sinh viên
                  <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {students.length} thành viên
                  </span>
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" placeholder="Tìm sinh viên..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
                  />
                </div>
              </div>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <GraduationCap size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Không tìm thấy sinh viên nào.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-4">Họ và tên</th>
                        <th className="px-6 py-4 hidden sm:table-cell">Ngày tham gia</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {/* 5. SỬA RENDER: Lặp qua danh sách User */}
                      {filteredStudents.map((user: UserResponseDto) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                                {getStudentName(user).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{getStudentName(user)}</div>
                                <div className="text-xs text-gray-500">{getStudentEmail(user)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            {/* Lưu ý: createdAt ở đây là ngày tạo tài khoản User, không phải ngày join lớp */}
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </td>
                          <td className="px-6 py-4 text-right"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
           <div className="text-center py-20 text-gray-500 animate-in fade-in duration-300">
             <BookOpen size={48} className="mx-auto text-gray-300 mb-4"/>
             <p>Nội dung bảng tin lớp học sẽ hiển thị ở đây.</p>
           </div>
        )}

        {activeTab === 'grades' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách bài tập</h2>
                <span className="text-sm font-medium px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg">
                    Tổng trọng số: {gradeItems.reduce((sum, item) => sum + (item.weight || 0), 0)}%
                </span>
             </div>

             {gradeItems.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chưa có bài tập nào</h3>
                  <p className="text-gray-500">Lớp học này chưa có cột điểm hoặc bài tập nào được tạo.</p>
                </div>
             ) : (
                <div className="grid gap-4">
                  {gradeItems.map((item) => {
                    const myGrade = getMyGradeInfo(item.id);
                    const isSubmitted = myGrade?.isSubmitted;
                    const hasScore = myGrade?.score !== null && myGrade?.score !== undefined;

                    return (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSubmitted ? 'bg-green-500' : 'bg-gray-300 group-hover:bg-blue-500'} transition-colors`}></div>

                          <div className="flex flex-col md:flex-row justify-between gap-4 pl-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                        {item.name}
                                    </h3>
                                    {isSubmitted && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase border border-green-200 flex items-center gap-1">
                                            <FileCheck size={12}/> Đã nộp
                                        </span>
                                    )}
                                </div>
                                {item.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                                        {item.description}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                   <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                      <Clock size={14} className="text-orange-500" /> 
                                      {formatDate(item.dueDate)}
                                   </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 min-w-[150px] justify-end border-t pt-3 md:border-t-0 md:pt-0 md:border-l md:pl-6 border-gray-100 dark:border-gray-700">
                                 <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-xl font-bold text-blue-600 dark:text-blue-400">
                                        <Percent size={18} />{item.weight}
                                    </div>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Trọng số</span>
                                 </div>
                                 
                                 {hasScore ? (
                                     <div className="text-center min-w-[60px] bg-green-50 dark:bg-green-900/20 p-1 rounded-lg">
                                        <div className="text-xl font-bold text-green-600">{myGrade?.score}</div>
                                        <span className="text-[10px] text-green-600 uppercase font-bold">Điểm</span>
                                     </div>
                                 ) : (
                                     <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                        <Upload size={18} />
                                     </div>
                                 )}
                              </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetail;