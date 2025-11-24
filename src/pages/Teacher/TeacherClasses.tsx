import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Search, Filter, ChevronDown, Plus } from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";
import { toast } from "react-toastify";
import { getCourses, createCourse } from "../../api/coursesService";
import { CourseResponseDto, CourseCreateDto } from "../../types/course";
import CrudFormModal from "../../components/modals/CrudFormModal";

const TeacherClasses: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [courses, setCourses] = useState<CourseResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(8);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) {
        setCourses([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getCourses({ teacherId: user.id, size: 100 });
        const data = res?.data;

        let items: CourseResponseDto[] = [];
        if (!data) {
          items = [];
        } else if (Array.isArray(data as any)) {
          items = data as any;
        } else if (Array.isArray((data as any)?.content)) {
          items = (data as any).content;
        } else if (Array.isArray((data as any)?.items)) {
          items = (data as any).items;
        } else if (Array.isArray((data as any)?.results)) {
          items = (data as any).results;
        } else {
          items = [];
        }

        setCourses(items);
      } catch (err) {
        console.error("Failed to load teacher courses", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user?.id]);

  useEffect(() => {
    setVisibleCount(8);
  }, [searchTerm]);

  const filtered = courses.filter((c) =>
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayed = filtered.slice(0, visibleCount);

  const handleLoadMore = () => setVisibleCount((p) => p + 8);

  const handleCreate = async (values: CourseCreateDto) => {
    try {
      const payload: CourseCreateDto = {
        ...values,
        userId: values.userId ?? user?.id ?? undefined,
      };

      const res = await createCourse(payload);
      const created = res?.data;
      if (created) {
        setCourses((prev) => [created, ...prev]);
        toast.success('Tạo lớp thành công!');
      }
      setShowCreateModal(false);
    } catch (err) {
      console.error("Create course failed", err);
      toast.error('Tạo lớp thất bại. Vui lòng thử lại.');
      // keep modal open so user can retry; optionally show toast
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="text-blue-600" /> Lớp học (Giáo viên)
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Danh sách lớp bạn đang quản lý.</p>
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
            >
              <Plus size={16} />
              Tạo lớp mới
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse h-56" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-4">
              <BookOpen size={48} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chưa có lớp nào</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              {searchTerm ? `Không có kết quả cho "${searchTerm}"` : "Bạn chưa tạo lớp nào."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayed.map((c) => (
                <div key={c.id} className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-indigo-500 to-violet-500 p-6 flex items-center justify-center relative">
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
                      <BookOpen className="text-white drop-shadow-md" size={32} />
                    </div>
                  </div>

                  <div className="flex-1 p-5 flex flex-col">
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Mã: {c.code ?? c.id}</div>
                      <Link to={`/teacher/class-detail/${c.id}`} className="text-blue-600 hover:underline font-medium">Chi tiết lớp (Giáo viên)</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < filtered.length && (
              <div className="flex justify-center mt-8">
                <button onClick={handleLoadMore} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300">
                  Xem thêm {filtered.length - visibleCount} lớp
                  <ChevronDown size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal: keep mounted regardless of filtered length so it can open from toolbar */}
      <CrudFormModal
        isOpen={showCreateModal}
        mode="create"
        title="Tạo lớp mới"
        initialValues={{ code: "", name: "" }}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        renderFields={({ values, handleChange }) => (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Mã lớp</label>
              <input
                value={values.code}
                onChange={(e) => handleChange('code' as any, e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tên lớp</label>
              <input
                value={values.name as string}
                onChange={(e) => handleChange('name' as any, e.target.value)}
                className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default TeacherClasses;
