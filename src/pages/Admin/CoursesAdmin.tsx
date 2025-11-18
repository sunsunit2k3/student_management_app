import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import { createCourse, deleteCourse, getCourses, updateCourse } from "../../api/coursesService";
import { CourseResponseDto } from "../../types/course";
import CrudFormModal from "../../components/modals/CrudFormModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

type CourseFormValues = {
  code: string;
  name: string;
  teacherId: string;
};

const CoursesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponseDto | null>(null);

  const baseFormValues = useMemo<CourseFormValues>(() => ({ code: "", name: "", teacherId: "" }), []);
  const editFormValues = useMemo<CourseFormValues>(
    () => ({
      code: selectedCourse?.code || "",
      name: selectedCourse?.name || "",
      teacherId: selectedCourse?.teacherId || "",
    }),
    [selectedCourse]
  );

  const columns: Column<CourseResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (c) => c.id },
    { key: 'code', header: 'Code', sortable: true, render: (c) => c.code },
    { key: 'name', header: 'Name', sortable: true, render: (c) => c.name || '' },
    { key: 'teacherName', header: 'Teacher Name', render: (c) => (
      <div>
        <div className="font-medium">{c.teacherName ?? c.teacherId ?? ''}</div>
        <div className="text-xs text-gray-400">{c.teacherId ? c.teacherId : ''}</div>
      </div>
    ) },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleString() : '') },
    { key: 'updatedAt', header: 'Updated At', sortable: true, render: (c) => (c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '') },
  ];

  const fetchData = useCallback(async ({ page, size }: FetchParams) => {
    const apiPage = Math.max(0, page - 1);
    const res = await getCourses({ page: apiPage, size });
    const list = res.data;
    const items = list?.content || [];
    return { items, total: list?.totalElements || items.length };
  }, [refreshTick]);

  function openCreateModal() {
    setSelectedCourse(null);
    setCreateOpen(true);
  }

  function openEditModal(course: CourseResponseDto) {
    setSelectedCourse(course);
    setEditOpen(true);
  }

  function openDeleteModal(course: CourseResponseDto) {
    setSelectedCourse(course);
    setDeleteOpen(true);
  }

  async function handleCreateCourse(values: CourseFormValues) {
    const normalizedName = values.name.trim();
    const normalizedTeacher = values.teacherId.trim();
    await createCourse({ code: values.code.trim(), name: normalizedName || undefined, userId: normalizedTeacher || undefined });
    setRefreshTick((x) => x + 1);
  }

  async function handleUpdateCourse(values: CourseFormValues) {
    if (!selectedCourse?.id) return;
    const normalizedName = values.name.trim();
    const normalizedTeacher = values.teacherId.trim();
    await updateCourse(selectedCourse.id, {
      id: selectedCourse.id,
      code: values.code.trim(),
      name: normalizedName || undefined,
      userId: normalizedTeacher || undefined,
    });
    setRefreshTick((x) => x + 1);
  }

  async function handleDeleteCourse() {
    if (!selectedCourse?.id) return;
    await deleteCourse(selectedCourse.id);
    setRefreshTick((x) => x + 1);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Courses (Admin)</h1>
        <p className="text-sm text-gray-500">Thêm, chỉnh sửa và theo dõi các khóa học cùng giảng viên phụ trách.</p>
      </div>
      <DataTable<CourseResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        toolbarSlot={
          <Button
            size="sm"
            onClick={openCreateModal}
          >
            Tạo mới
          </Button>
        }
        emptyState={{
          title: 'Chưa có khóa học',
          description: 'Bấm “+ Khóa học” để tạo bản ghi đầu tiên.',
          action: (
            <Button size="sm" onClick={openCreateModal} >
              Tạo ngay
            </Button>
          ),
        }}
        renderActions={(c) => (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openEditModal(c)}
            >
              Chỉnh sửa
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openDeleteModal(c)}
            >
              Xóa
            </Button>
          </>
        )}
      />

      <CrudFormModal<CourseFormValues>
        isOpen={createOpen}
        mode="create"
        initialValues={baseFormValues}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateCourse}
        description="Nhập thông tin khóa học và liên kết giảng viên phụ trách."
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mã khóa học</label>
              <input
                value={values.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="VD: CS101"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên khóa học</label>
              <input
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="Nhập tên khóa học"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Teacher ID</label>
              <input
                value={values.teacherId}
                onChange={(e) => handleChange('teacherId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="Nhập UUID giảng viên"
              />
            </div>
          </div>
        )}
      />

      <CrudFormModal<CourseFormValues>
        isOpen={editOpen}
        mode="update"
        initialValues={editFormValues}
        onClose={() => {
          setEditOpen(false);
          setSelectedCourse(null);
        }}
        onSubmit={handleUpdateCourse}
        description={`Cập nhật thông tin cho khóa học ${selectedCourse?.code || ''}.`}
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mã khóa học</label>
              <input
                value={values.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên khóa học</label>
              <input
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Teacher ID</label>
              <input
                value={values.teacherId}
                onChange={(e) => handleChange('teacherId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedCourse?.code}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedCourse(null);
        }}
        onConfirm={async () => {
          await handleDeleteCourse();
          setDeleteOpen(false);
          setSelectedCourse(null);
        }}
        title="Xóa khóa học"
      />
    </div>
  );
};

export default CoursesAdmin;
