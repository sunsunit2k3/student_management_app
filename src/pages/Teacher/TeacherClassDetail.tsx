import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import useAuthStore from '../../stores/useAuthStore';
import { ArrowLeft, Calendar, Plus, Edit, Trash, FileText, Users, Award } from 'lucide-react';
import DatePicker from '../../components/form/date-picker';
import CrudFormModal from '../../components/modals/CrudFormModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import GradingModal from '../../components/modals/GradingModal';
import Button from '../../components/ui/button/Button';
import { toast } from 'react-toastify';

import { getCourseById } from '../../api/coursesService';
import { createEnrollment, getEnrollmentsByCourse, deleteEnrollment, getEnrollmentsByUser } from '../../api/enrollmentService';
import {
  createGradeItem,
  getGradeItemsByCourse,
  getGradeItemById,
  updateGradeItem,
  deleteGradeItem,
} from '../../api/gradeItemService';
import {
  createStudentGrade,
  getGradesByEnrollment,
  updateStudentGrade,
} from '../../api/studentGradeService';

import { CourseResponseDto } from '../../types/course';
import { GradeItemResponseDto, GradeItemCreateDto, GradeItemUpdateDto } from '../../types/gradeitem';
import { StudentGradeResponseDto } from '../../types/studentgrade';
import { UserResponseDto } from '../../types/user';
import { EnrollmentResponseDto } from '../../types';

type GradeItemFormValues = {
  name: string;
  description?: string;
  dueDate?: string;
  weight?: number;
};


const TeacherClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [course, setCourse] = useState<CourseResponseDto | null>(null);
  const [students, setStudents] = useState<UserResponseDto[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentResponseDto[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeItemResponseDto[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [gradeItemsLoaded, setGradeItemsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'people' | 'submissions' | 'assignments'>('people');
  const [loading, setLoading] = useState<boolean>(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<GradeItemResponseDto | null>(null);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<UserResponseDto | null>(null);
  const [processingDelete, setProcessingDelete] = useState(false);
  const [deleteGradeModalOpen, setDeleteGradeModalOpen] = useState(false);
  const [deletingGradeItem, setDeletingGradeItem] = useState<GradeItemResponseDto | null>(null);
  const [processingDeleteGrade, setProcessingDeleteGrade] = useState(false);

  // grading modal
  const [gradingStudent, setGradingStudent] = useState<UserResponseDto | null>(null);
  const [currentEnrollmentId, setCurrentEnrollmentId] = useState<string | null>(null);
  const [studentGradesMap, setStudentGradesMap] = useState<Record<string, StudentGradeResponseDto>>({});

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const teacherId = user?.id || undefined;
        const courseRes = await getCourseById(id, { teacherId });
        const courseData = (courseRes as any)?.data || courseRes;
        setCourse(courseData || null);
      } catch (err) {
        toast.error('Lỗi khi tải dữ liệu lớp học');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id, user?.id]);

  const loadEnrollments = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const enrollRes = await getEnrollmentsByCourse(id);
      const enrollData = (enrollRes as any)?.data || enrollRes;
      const list = Array.isArray(enrollData) ? enrollData : enrollData?.content || [];

      if (list && list.length > 0) {
        const first = list[0];
        if (first && (first.username !== undefined || first.firstName !== undefined || first.lastName !== undefined)) {
          setStudents(list as UserResponseDto[]);
          setEnrollments([]);
        } else {
          setEnrollments(list as EnrollmentResponseDto[]);
          const users: UserResponseDto[] = list.map((e: any) => e.user || e.student || { id: e.studentId || e.userId });
          setStudents(users);
        }
      } else {
        setStudents([]);
        setEnrollments([]);
      }

      setStudentsLoaded(true);
    } catch (err) {
      console.error('Failed to load enrollments', err);
      toast.error('Lỗi khi tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const loadGradeItems = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const giRes = await getGradeItemsByCourse(id);
      const giData = (giRes as any)?.data || giRes;
      setGradeItems(Array.isArray(giData) ? giData : giData?.content || []);
      setGradeItemsLoaded(true);
    } catch (err) {
      console.error('Failed to load grade items', err);
      toast.error('Lỗi khi tải bài tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    if (activeTab === 'people') {
      if (!studentsLoaded) loadEnrollments();
      if (!gradeItemsLoaded) loadGradeItems();
    }
    if (activeTab === 'submissions') {
      if (!studentsLoaded) loadEnrollments();
      if (!gradeItemsLoaded) loadGradeItems();
    }
    if (activeTab === 'assignments' && !gradeItemsLoaded) {
      loadGradeItems();
    }
  }, [activeTab, id]);

  const openCreateModal = () => {
    setEditItem(null);
    setCreateOpen(true);
  };

  const openAddStudentModal = () => {
    setAddStudentOpen(true);
  };

  const openDeleteStudentModal = (student: UserResponseDto) => {
    setDeletingStudent(student);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent || !id) return;
    setProcessingDelete(true);
    try {
      // Fetch enrollments for this user to find the correct enrollment ID
      const userEnrollmentsRes = await getEnrollmentsByUser(deletingStudent.id);
      const userEnrollments = (userEnrollmentsRes as any)?.data || userEnrollmentsRes;
      const list = Array.isArray(userEnrollments) ? userEnrollments : [];
      
      const enrollment = list.find((e: EnrollmentResponseDto) => e.courseId === id);

      if (!enrollment) {
        toast.error('Không tìm thấy enrollment của sinh viên trong lớp này');
        return;
      }

      await deleteEnrollment(enrollment.id);
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id));
      // We don't really use enrollments state for display anymore since it's empty, but good to keep consistent if we did
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollment.id));
      toast.success('Đã xóa sinh viên khỏi lớp');
    } catch (err) {
      console.error('Failed to delete enrollment', err);
      toast.error('Xóa sinh viên khỏi lớp thất bại');
    } finally {
      setProcessingDelete(false);
      setDeleteModalOpen(false);
      setDeletingStudent(null);
    }
  };

  const handleCreateGradeItem = async (values: GradeItemCreateDto) => {
    if (!id) return;
    try {
      // client-side validation
      if (!values.name || values.name.trim() === '') {
        toast.error('Tên bài tập là bắt buộc');
        return false;
      }
      if (values.weight !== undefined && (values.weight < 0 || values.weight > 100)) {
        toast.error('Trọng số phải nằm trong khoảng 0 - 100');
        return false;
      }
      const payload: any = {
        name: values.name,
        description: values.description,
        dueDate: values.dueDate || null,
        weight: values.weight || 0,
        courseId: id,
      };
      await createGradeItem(payload);
      toast.success('Tạo bài tập thành công');
      setCreateOpen(false);
      // reload
      const res = await getGradeItemsByCourse(id);
      const gi = (res as any)?.data || res;
      setGradeItems(Array.isArray(gi) ? gi : []);
      return true;
    } catch (err) {
      console.error('❌ Error in handleCreateGradeItem:', err);
      toast.error('Tạo bài tập thất bại');
      return false;
    }
  };

  const handleCreateEnrollment = async (values: { userId: string }) => {
    if (!id) return;
    try {
      // validation
      if (!values.userId || values.userId.trim() === '') {
        toast.error('User ID không được để trống');
        return false;
      }
      const payload: any = { userId: values.userId.trim(), courseId: id };
      const res = await createEnrollment(payload);
      const created = (res as any)?.data || res;
      if (created) {
        // try to extract user
        const userObj = created.user || created.student || created;
        if (userObj && userObj.id) {
          setStudents((prev) => [...prev, userObj]);
        }
        setEnrollments((prev) => [...prev, created]);
      }
      toast.success('Thêm sinh viên vào lớp thành công');
      setAddStudentOpen(false);
      return true;
    } catch (err) {
      console.error('Failed to add enrollment', err);
      toast.error('Thêm sinh viên thất bại');
      return false;
    }
  };

  const handleEditGradeItem = async (itemId: string, values: GradeItemUpdateDto) => {
    try {
      if (!values.name || values.name.trim() === '') {
        toast.error('Tên bài tập là bắt buộc');
        return false;
      }
      if (values.weight !== undefined && (values.weight < 0 || values.weight > 100)) {
        toast.error('Trọng số phải nằm trong khoảng 0 - 100');
        return false;
      }
      const payload: any = {
        name: values.name,
        description: values.description,
        dueDate: values.dueDate || null,
        weight: values.weight || 0,
      };
      await updateGradeItem(itemId, payload);
      toast.success('Cập nhật bài tập thành công');
      setEditItem(null);
      setCreateOpen(false);
      const res = await getGradeItemsByCourse(id as string);
      const gi = (res as any)?.data || res;
      setGradeItems(Array.isArray(gi) ? gi : []);
      return true;
    } catch (err) {
      console.error('❌ Error in handleEditGradeItem:', err);
      toast.error('Cập nhật bài tập thất bại');
      return false;
    }
  };

  const openDeleteGradeModal = (item: GradeItemResponseDto) => {
    setDeletingGradeItem(item);
    setDeleteGradeModalOpen(true);
  };

  const handleConfirmDeleteGradeItem = async () => {
    if (!deletingGradeItem) return;
    setProcessingDeleteGrade(true);
    try {
      await deleteGradeItem(deletingGradeItem.id);
      setGradeItems((prev) => prev.filter((g) => g.id !== deletingGradeItem.id));
      toast.success('Xóa bài tập thành công');
    } catch (err) {
      console.error('Failed to delete grade item', err);
      toast.error('Xóa bài tập thất bại');
    } finally {
      setProcessingDeleteGrade(false);
      setDeleteGradeModalOpen(false);
      setDeletingGradeItem(null);
    }
  };

  // Grading flows
  const openGradingForStudent = async (student: UserResponseDto) => {
    if (!id) return;
    try {
      // Fetch enrollments for this user to find the correct enrollment ID
      const userEnrollmentsRes = await getEnrollmentsByUser(student.id);
      const userEnrollments = (userEnrollmentsRes as any)?.data || userEnrollmentsRes;
      const list = Array.isArray(userEnrollments) ? userEnrollments : [];
      
      const enrollment = list.find((e: EnrollmentResponseDto) => e.courseId === id);
      
      if (!enrollment) {
        toast.error('Không tìm thấy enrollment của sinh viên');
        return;
      }
      
      setGradingStudent(student);
      setCurrentEnrollmentId(enrollment.id);

      const res = await getGradesByEnrollment(enrollment.id);
      const grades = (res as any)?.data || res || [];
      const map: Record<string, StudentGradeResponseDto> = {};
      (Array.isArray(grades) ? grades : []).forEach((g: StudentGradeResponseDto) => {
        if (g.gradeItemId) map[g.gradeItemId] = g;
      });
      setStudentGradesMap(map);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải điểm sinh viên');
    }
  };



  const handleSaveScore = async (gradeItem: GradeItemResponseDto, scoreValue: number) => {
    if (!gradingStudent || !currentEnrollmentId) return;
    try {
      if (scoreValue === null || scoreValue === undefined || isNaN(Number(scoreValue))) {
        toast.error('Điểm không hợp lệ');
        return;
      }
      if (scoreValue < 0 || scoreValue > 10) {
        toast.error('Điểm phải nằm trong khoảng 0 - 10');
        return;
      }
      
      const enrollmentId = currentEnrollmentId;

      const existing = studentGradesMap[gradeItem.id];
      if (existing && existing.id) {
        await updateStudentGrade(existing.id, { ...existing, score: scoreValue });
        toast.success('Chấm điểm thành công');
      } else {
        const payload: any = { enrollmentId, gradeItemId: gradeItem.id, score: scoreValue, isSubmitted: true };
        const res = await createStudentGrade(payload);
        const created = (res as any)?.data || res;
        if (created) {
          setStudentGradesMap((prev) => ({ ...prev, [gradeItem.id]: created }));
        }
        toast.success('Chấm điểm thành công');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ghi điểm thất bại');
    } finally {
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center text-gray-500">Đang tải dữ liệu...</div>
    </div>
  );

  if (!course) return (
    <div className="text-center mt-20">
      <h2 className="text-xl text-gray-600">Không tìm thấy thông tin lớp học.</h2>
      <Link to="/teacher/classes" className="text-blue-500 hover:underline mt-2 block">Quay lại</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-6">
            <Link to="/teacher/classes" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-4">
              <ArrowLeft size={20} className="mr-2" />
              Quay lại danh sách
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">Mã lớp: {course.code}</span>
                  <span className="flex items-center gap-2 text-sm"><Calendar size={16} />{course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : '-'}</span>
                </div>
              </div>
                <div className="flex gap-2">
                <Button onClick={openCreateModal} variant="primary" startIcon={<Plus size={16} />} className="rounded-xl">
                  Tạo bài tập
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => setActiveTab('people')} variant={activeTab === 'people' ? 'primary' : 'outline'} startIcon={<Users size={16} />} className="px-3 py-2 rounded-md text-sm font-medium">
              Sinh viên
            </Button>
            <Button onClick={() => setActiveTab('assignments')} variant={activeTab === 'assignments' ? 'primary' : 'outline'} startIcon={<Award size={16} />} className="px-3 py-2 rounded-md text-sm font-medium">
              Bài tập
            </Button>
            <Button onClick={() => setActiveTab('submissions')} variant={activeTab === 'submissions' ? 'primary' : 'outline'} startIcon={<FileText size={16} />} className="px-3 py-2 rounded-md text-sm font-medium">
              Bài nộp
            </Button>
          </div>
        </div>

        {/* Tab panels */}
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
                    {course.teacherName || 'Chưa cập nhật tên'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    Giáo viên chủ nhiệm
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
                <div className="flex items-center gap-2">
                  <Button onClick={openAddStudentModal} variant="primary" className="px-3 py-2 rounded-md bg-green-600 text-sm">Thêm sinh viên</Button>
                </div>
              </div>
              {students.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Không có sinh viên.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {students.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                            {(s.firstName || s.lastName ? `${s.firstName || ''}${s.lastName ? ' ' + s.lastName : ''}` : s.username || 'Ẩn danh').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{(s.firstName && s.lastName) ? `${s.firstName} ${s.lastName}` : s.username || 'Ẩn danh'}</div>
                            <div className="text-xs text-gray-500">{s.email || ''}</div>
                          </div>
                        </div>
                        <div>
                          <Button onClick={() => openDeleteStudentModal(s)} variant="danger" className="p-2">Xóa khỏi lớp</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="animate-in fade-in duration-300">
             <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách nộp bài</h3>
                  <span className="text-sm text-gray-500">{students.length} sinh viên</span>
                </div>
                {students.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Chưa có sinh viên nào trong lớp.</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {students.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => openGradingForStudent(s)}>
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                            {(s.firstName || s.lastName ? `${s.firstName || ''}${s.lastName ? ' ' + s.lastName : ''}` : s.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{(s.firstName && s.lastName) ? `${s.firstName} ${s.lastName}` : s.username || 'Ẩn danh'}</div>
                            <div className="text-xs text-gray-500">{s.email || 'No email'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="text-right mr-4 hidden sm:block">
                              <div className="text-xs text-gray-400">Trạng thái</div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Xem bài nộp & Chấm điểm</div>
                           </div>
                           <Button onClick={(e) => { e.stopPropagation(); openGradingForStudent(s); }} variant="primary" className="px-4 py-2 rounded-lg shadow-sm">
                              Chấm bài
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="grid md:grid-cols-1 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Danh sách bài tập</h3>
                <Button onClick={() => { setEditItem(null); setCreateOpen(true); }} variant="primary" startIcon={<Plus size={14} />} className="px-3 py-2 rounded-md">Thêm</Button>
              </div>
              {gradeItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Chưa có bài tập nào.</div>
              ) : (
                <div className="space-y-3">
                  {gradeItems.map((g) => (
                    <div key={g.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{g.name}</div>
                        <div className="text-xs text-gray-500">Trọng số: {g.weight}% • Hạn: {g.dueDate ? new Date(g.dueDate).toLocaleString() : 'Không có'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                                  <Button onClick={async () => {
                                    try {
                                      const res = await getGradeItemById(g.id);
                                      const freshItem = (res as any)?.data || res;
                                      setEditItem(freshItem);
                                      setCreateOpen(true);
                                    } catch (err) {
                                      console.error('❌ Error fetching grade item:', err);
                                      toast.error('Không thể tải dữ liệu bài tập');
                                    }
                                  }} variant="outline" className="p-2 rounded-md"><Edit size={16} /></Button>
                                  <Button onClick={() => openDeleteGradeModal(g)} variant="danger" className="p-2 rounded-md"><Trash size={16} /></Button>
                            </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CrudFormModal<GradeItemFormValues>
        isOpen={createOpen}
        mode={editItem ? 'update' : 'create'}
        title={editItem ? 'Sửa bài tập' : 'Tạo bài tập'}
        initialValues={{ name: editItem?.name || '', description: editItem?.description || '', dueDate: editItem?.dueDate || '', weight: editItem?.weight || 0 }}
        onClose={() => { setCreateOpen(false); setEditItem(null); }}
        onSubmit={(vals) => (editItem ? handleEditGradeItem(editItem.id, vals as GradeItemUpdateDto) : handleCreateGradeItem(vals as GradeItemCreateDto))}
        renderFields={({ values, handleChange }) => (
          <div className="space-y-4">     
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tên</label>
              <input value={values.name} onChange={(e) => handleChange('name' as any, e.target.value)} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Mô tả</label>
              <textarea value={values.description} onChange={(e) => handleChange('description' as any, e.target.value)} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Hạn nộp</label>
              <DatePicker
                id={`dueDate-${editItem?.id || 'new'}`}
                enableTime={true}
                time_24hr={true}
                defaultDate={values.dueDate ? new Date(values.dueDate as any) : undefined}
                placeholder="Chọn ngày giờ"
                onChange={(selectedDates: any) => {
                  const d = Array.isArray(selectedDates) && selectedDates[0] ? selectedDates[0] : null;
                  handleChange('dueDate' as any, d ? (d as Date).toISOString() : '');
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Trọng số</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { key: 'A', label: 'A', value: 60.0 },
                    { key: 'B', label: 'B', value: 30.0 },
                    { key: 'C', label: 'C', value: 10.0 },
                  ].map((preset) => {
                    const isActive = Math.abs((values.weight || 0) - preset.value) < 0.0001;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handleChange('weight' as any, preset.value)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                      >
                        {preset.label} ({preset.value}%)
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    value={values.weight as any}
                    onChange={(e) => handleChange('weight' as any, Number(e.target.value))}
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      />

      <CrudFormModal<{ userId: string }>
        isOpen={addStudentOpen}
        mode="create"
        title="Thêm sinh viên vào lớp"
        initialValues={{ userId: '' }}
        onClose={() => { setAddStudentOpen(false); }}
        onSubmit={(vals) => handleCreateEnrollment(vals as { userId: string })}
        renderFields={({ values, handleChange }) => (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">User ID</label>
              <input value={values.userId} onChange={(e) => handleChange('userId' as any, e.target.value)} className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              <p className="text-xs text-gray-500 mt-1">Nhập `userId` của sinh viên (hoặc email tùy API).</p>
            </div>
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Xóa sinh viên khỏi lớp"
        entityName={deletingStudent ? `${deletingStudent.firstName || ''} ${deletingStudent.lastName || ''}` : undefined}
        onClose={() => { if (!processingDelete) { setDeleteModalOpen(false); setDeletingStudent(null); } }}
        onConfirm={handleConfirmDelete}
        isProcessing={processingDelete}
      />

      <DeleteConfirmModal
        isOpen={deleteGradeModalOpen}
        title="Xóa bài tập"
        entityName={deletingGradeItem ? deletingGradeItem.name : undefined}
        onClose={() => { if (!processingDeleteGrade) { setDeleteGradeModalOpen(false); setDeletingGradeItem(null); } }}
        onConfirm={handleConfirmDeleteGradeItem}
        isProcessing={processingDeleteGrade}
      />

      <GradingModal
        isOpen={!!gradingStudent}
        onClose={() => { setGradingStudent(null); setCurrentEnrollmentId(null); setStudentGradesMap({}); }}
        student={gradingStudent}
        gradeItems={gradeItems}
        initialGradesMap={studentGradesMap}
        onSaveScore={handleSaveScore}
      />
    </div>
  );
};

export default TeacherClassDetail;
