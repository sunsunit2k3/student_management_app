import React, { useEffect, useState } from "react";
import { FileText, Clock, Percent, Upload, FileCheck } from 'lucide-react';
import useAuthStore from "../../stores/useAuthStore";
import { getGradeItemByStudentId } from "../../api/gradeItemService";
import { GradeItemResponseDto } from "../../types/gradeitem";
import SubmissionModal from "../../components/modals/SubmissionModal";
import { StudentGradeResponseDto } from "../../types/studentgrade";
import { getStudentGradesByStudentId } from "../../api/studentGradeService";

const StudentAssignments: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [gradeItems, setGradeItems] = useState<GradeItemResponseDto[]>([]);
  const [selectedItem, setSelectedItem] = useState<GradeItemResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Sử dụng Record để map: Key = gradeItemId, Value = StudentGradeResponseDto
  const [myGrades, setMyGrades] = useState<Record<string, StudentGradeResponseDto>>({});

  // --- EFFECT: Load Data ---
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Chạy song song cả 2 request để tiết kiệm thời gian
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

  // --- API CALLS ---
  const fetchStudentGrades = async () => {
    try {
      if (!user) return;
      const response = await getStudentGradesByStudentId(user.id);
      
      if (response?.data) {
        // Chuyển Array thành Map (Object) để tra cứu O(1) theo gradeItemId
        const gradesMap: Record<string, StudentGradeResponseDto> = {};
        
        response.data.forEach((grade) => {
          // Quan trọng: Map key là gradeItemId
          gradesMap[grade.gradeItemId] = grade;
        });
        
        console.log("Mapped Grades:", gradesMap); // Debug log để kiểm tra data
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
    // Lưu ý: setLoading(false) đã được xử lý ở useEffect cha
  };

  // --- HELPERS ---
  const getMyGradeInfo = (itemId: string): StudentGradeResponseDto | undefined => {
    return myGrades[itemId];
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Không có hạn';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // --- HANDLERS ---
  const handleSubmitAssignment = async (file: File) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Uploading ${file.name} for item ${selectedItem?.id}`);
        
        if (selectedItem && user) {
             // Cập nhật optimistic UI (giả lập đã nộp thành công ngay lập tức)
             setMyGrades(prev => ({
                 ...prev,
                 [selectedItem.id]: { 
                     ...prev[selectedItem.id], 
                     id: prev[selectedItem.id]?.id || "temp-id", // Giữ ID cũ hoặc tạo tạm
                     enrollmentId: prev[selectedItem.id]?.enrollmentId || "", 
                     gradeItemId: selectedItem.id,
                     isSubmitted: true, // <-- QUAN TRỌNG: Cập nhật trạng thái này
                     submissionDate: new Date().toISOString(),
                     score: prev[selectedItem.id]?.score, // Giữ nguyên điểm nếu có
                 }
             }));
        }
        resolve();
      }, 1500);
    });
  };

  if (loading) {
      return <div className="p-6 text-center">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
                // 1. Lấy thông tin điểm/nộp bài dựa trên ID cột điểm
                const myGrade = getMyGradeInfo(item.id);
                
                // 2. Kiểm tra trạng thái nộp bài từ DTO
                const isSubmitted = myGrade?.isSubmitted === true;
                const hasScore = myGrade?.score !== null && myGrade?.score !== undefined;

                return (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      {/* Thanh chỉ báo trạng thái bên trái */}
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
                             <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                               <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  <Clock size={14} className="text-orange-500" /> 
                                  {formatDate(item.dueDate)}
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