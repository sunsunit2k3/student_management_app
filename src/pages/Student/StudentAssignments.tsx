import React, { useEffect, useState, useMemo } from "react";
import { FileText, Clock, Percent, Upload, FileCheck, Search } from 'lucide-react';
import DatePicker from "../../components/form/date-picker";
import useAuthStore from "../../stores/useAuthStore";
import { getGradeItemByStudentId } from "../../api/gradeItemService";
import { uploadFile } from "../../api/submissionFileService";
import { createStudentGrade, updateStudentGrade } from "../../api/studentGradeService";
import { getEnrollmentsByUser } from "../../api/enrollmentService";
import { toast } from 'react-toastify';
import { GradeItemResponseDto } from "../../types/gradeitem";
import SubmissionModal from "../../components/modals/SubmissionModal";
import { StudentGradeResponseDto } from "../../types/studentgrade";
import { getStudentGradesByStudentId } from "../../api/studentGradeService";

const StudentAssignments: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [gradeItems, setGradeItems] = useState<GradeItemResponseDto[]>([]);
  const [selectedItem, setSelectedItem] = useState<GradeItemResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [myGrades, setMyGrades] = useState<Record<string, StudentGradeResponseDto>>({});
  // Filter & pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        await Promise.all([
          fetchGradeItems(),
          fetchStudentGrades()
        ]);
      } catch (error) {
        console.error("Error loading assignment data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]); // Thêm dependency user?.id

  const fetchStudentGrades = async () => {
    try {
      if (!user) return;
      const response = await getStudentGradesByStudentId(user.id);
      
      if (response?.data) {
        const gradesMap: Record<string, StudentGradeResponseDto> = {};
        
        response.data.forEach((grade) => {
          gradesMap[grade.gradeItemId] = grade;
        });
        
        setMyGrades(gradesMap);
      }
    } catch (error) {
      console.error("Failed to fetch student grades", error);
    }    
  };   

  const fetchGradeItems = async () => {
    try {
      const response = await getGradeItemByStudentId(user?.id || ''); 
      if (response?.data) {
        setGradeItems(response?.data);
      }
    } catch (error) {
      console.error("Failed to fetch grade items", error);
    }
  };

  const getMyGradeInfo = (itemId: string): StudentGradeResponseDto | undefined => {
    return myGrades[itemId];
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Không có hạn';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const handleSubmitAssignment = async (file: File) => {
    if (!selectedItem || !user) {
      toast.error('Không tìm thấy thông tin mục bài tập hoặc người dùng.');
      return;
    }

    setMyGrades(prev => ({
      ...prev,
      [selectedItem.id]: {
        ...prev[selectedItem.id],
        id: prev[selectedItem.id]?.id || 'temp-id',
        enrollmentId: prev[selectedItem.id]?.enrollmentId || '',
        gradeItemId: selectedItem.id,
        isSubmitted: true,
        submissionDate: new Date().toISOString(),
        score: prev[selectedItem.id]?.score,
      }
    }));

    try {
      let studentGradeId = myGrades[selectedItem.id]?.id;

      if (!studentGradeId) {
        const enrollRes = await getEnrollmentsByUser(user.id);
        const enrollments = (enrollRes as any)?.data || enrollRes;
        const enrollment = Array.isArray(enrollments) ? enrollments.find((e: any) => e.courseId === selectedItem.courseId) : null;

        if (!enrollment) {
          throw new Error('Không tìm thấy thông tin tham gia lớp (Enrollment) cho sinh viên.');
        }

        const createPayload = {
          enrollmentId: enrollment.id,
          gradeItemId: selectedItem.id,
          score: null,
          isSubmitted: true,
          submissionDate: new Date().toISOString(),
        };

        const createRes = await createStudentGrade(createPayload);
        const created = (createRes as any)?.data || createRes;
        studentGradeId = created.id;
      } else {
        await updateStudentGrade(studentGradeId, { id: studentGradeId, isSubmitted: true });
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentGradeId', studentGradeId as string);

      await uploadFile(formData);

      toast.success('Nộp bài thành công.');
      await fetchStudentGrades();
      return studentGradeId;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Lỗi khi nộp bài.');
      await fetchStudentGrades();
      throw error;
    }
  };

  const filteredGradeItems = useMemo(() => {
    return gradeItems.filter(item => {
      // Search filter (name + description)
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const nameMatch = item.name?.toLowerCase().includes(term);
        const descMatch = item.description?.toLowerCase().includes(term);
        if (!nameMatch && !descMatch) return false;
      }

      // Date range filter (dueDate within [startDate, endDate])
      if (startDate) {
        if (!item.dueDate || new Date(item.dueDate) < new Date(startDate)) return false;
      }
      if (endDate) {
        if (!item.dueDate || new Date(item.dueDate) > new Date(endDate + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [gradeItems, searchTerm, startDate, endDate]);

  const visibleItems = filteredGradeItems.slice(0, visibleCount);

  if (loading) {
      return <div className="p-6 text-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách bài tập</h2>
            </div>
            {/* Bộ lọc */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Tìm kiếm</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tên hoặc mô tả bài tập..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <DatePicker
                  id="startDatePicker"
                  label="Từ ngày"
                  placeholder="Chọn ngày bắt đầu"
                  dateFormat="Y-m-d"
                  defaultDate={startDate || undefined}
                  onChange={(...args) => setStartDate(args[1] || '')}
                />
              </div>
              <div>
                <DatePicker
                  id="endDatePicker"
                  label="Đến ngày"
                  placeholder="Chọn ngày kết thúc"
                  dateFormat="Y-m-d"
                  defaultDate={endDate || undefined}
                  onChange={(...args) => setEndDate(args[1] || '')}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStartDate('');
                    setEndDate('');
                    setVisibleCount(10);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
         </div>

         {filteredGradeItems.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Không tìm thấy bài tập</h3>
              <p className="text-gray-500">Hãy điều chỉnh từ khóa hoặc bộ lọc ngày.</p>
            </div>
         ) : (
            <div className="grid gap-4">
              {visibleItems.map((item) => {
                const myGrade = getMyGradeInfo(item.id);
                const isSubmitted = myGrade?.isSubmitted === true;
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
                                {/* Hiển thị Badge Đã nộp */}
                                {isSubmitted && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase border border-green-200 flex items-center gap-1">
                                        <FileCheck size={12}/> Đã nộp
                                    </span>
                                )}
                            </div>
                            {/* ... Phần mô tả và ngày tháng giữ nguyên ... */}
                            {item.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                                    {item.description}
                                </p>
                            )}
                               <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  <Clock size={14} className="text-orange-500" /> 
                                  {formatDate(item.dueDate)}
                                </span>
                                {myGrade?.submissionDate && (
                                  <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-[13px]">
                                   <FileCheck size={14} className="text-green-600" />
                                   {formatDate(myGrade.submissionDate)}
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded text-[12px] font-semibold ${hasScore ? 'bg-green-100 text-green-700 border border-green-200' : isSubmitted ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                  {hasScore ? 'Đã chấm' : (isSubmitted ? 'Chưa chấm' : 'Chưa nộp')}
                                </span>
                              </div>
                          </div>

                          <div className="flex items-center gap-4 min-w-[150px] justify-end border-t pt-3 md:border-t-0 md:pt-0 md:border-l md:pl-6 border-gray-100 dark:border-gray-700">
                             {/* ... Phần trọng số giữ nguyên ... */}
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
                                 // Icon Upload: Nếu đã nộp nhưng chưa có điểm thì hiện màu xanh hoặc icon check
                                 <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${isSubmitted ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                    {isSubmitted ? <FileCheck size={18} /> : <Upload size={18} />}
                                 </div>
                             )}
                          </div>
                      </div>
                    </div>
                );
              })}
              {/* Nút hiển thị thêm */}
              {visibleCount < filteredGradeItems.length && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setVisibleCount(c => c + 10)}
                    className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                  >
                    Hiển thị thêm
                  </button>
                </div>
              )}
            </div>
         )}
       </div>

       <SubmissionModal 
          isOpen={!!selectedItem}
          selectedItem={selectedItem}
          myGrade={selectedItem ? getMyGradeInfo(selectedItem.id) : undefined}
          onClose={() => setSelectedItem(null)}
          onSubmit={handleSubmitAssignment}
       />
    </div>
  );
};

export default StudentAssignments;