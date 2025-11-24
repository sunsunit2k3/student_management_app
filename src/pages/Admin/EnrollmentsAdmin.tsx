import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import enrollmentService from "../../api/enrollmentService";
import { EnrollmentResponseDto } from "../../types/enrollment";
import CrudFormModal from "../../components/modals/CrudFormModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

type EnrollmentFormValues = {
  userId: string;
  courseId: string;
};

const EnrollmentsAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentResponseDto | null>(null);

  const baseFormValues = useMemo<EnrollmentFormValues>(() => ({ userId: "", courseId: "" }), []);
  const editFormValues = useMemo<EnrollmentFormValues>(
    () => ({
      userId: selectedEnrollment?.userId || "",
      courseId: selectedEnrollment?.courseId || "",
    }),
    [selectedEnrollment]
  );

  const columns: Column<EnrollmentResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (e) => e.id },
    { key: 'user', header: 'User', render: (e) => (
        <div>
          <div className="font-medium">{e.userName ?? e.userId}</div>
          <div className="text-xs text-gray-400">{e.userName ? e.userId : ''}</div>
        </div>
      )
    },
    { key: 'course', header: 'Course', render: (e) => (
        <div>
          <div className="font-medium">{e.courseName ?? e.courseId}</div>
          <div className="text-xs text-gray-400">{e.courseName ? e.courseId : ''}</div>
        </div>
      )
    },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (e) => (e.createdAt ? new Date(e.createdAt).toLocaleString() : '-') },
  ];

  const fetchData = useCallback(async ({ page = 0, size = 10, query, sortBy, sortOrder }: FetchParams) => {
    const res = await enrollmentService.getAllEnrollments();
    const payload: any = res.data;
    let items: EnrollmentResponseDto[] = [];
    let total = 0;
    if (Array.isArray(payload)) {
      items = payload;
      total = payload.length;
    } else if (payload && Array.isArray(payload.content)) {
      items = payload.content;
      total = payload.totalElements || items.length;
    }

    if (query) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        (it.userName || it.userId || '').toLowerCase().includes(q) ||
        (it.courseName || it.courseId || '').toLowerCase().includes(q)
      );
    }

    if (sortBy) {
      const direction = sortOrder === 'desc' ? -1 : 1;
      items = [...items].sort((a, b) => {
        const getValue = (record: EnrollmentResponseDto) => {
          if (sortBy === 'id') return record.id ?? '';
          if (sortBy === 'createdAt') return record.createdAt ?? '';
          return '';
        };
        const aVal = getValue(a);
        const bVal = getValue(b);
        if (aVal < bVal) return -1 * direction;
        if (aVal > bVal) return 1 * direction;
        return 0;
      });
    }

    total = items.length;
    const safePage = Math.max(0, page);
    const safeSize = Math.max(1, size);
    const start = safePage * safeSize;
    const paged = items.slice(start, start + safeSize);

    return { items: paged, total };
  }, [refreshTick]);

  function openCreateModal() {
    setSelectedEnrollment(null);
    setCreateOpen(true);
  }

  function openEditModal(e: EnrollmentResponseDto) {
    setSelectedEnrollment(e);
    setEditOpen(true);
  }

  function openDeleteModal(e: EnrollmentResponseDto) {
    setSelectedEnrollment(e);
    setDeleteOpen(true);
  }

  async function handleCreateEnrollment(values: EnrollmentFormValues) {
    await enrollmentService.createEnrollment({ userId: values.userId.trim(), courseId: values.courseId.trim() });
    setRefreshTick((x) => x + 1);
  }

  async function handleUpdateEnrollment(values: EnrollmentFormValues) {
    if (!selectedEnrollment?.id) return;
    await enrollmentService.updateEnrollment(selectedEnrollment.id, { id: selectedEnrollment.id });
    setRefreshTick((x) => x + 1);
  }

  async function handleDeleteEnrollment() {
    if (!selectedEnrollment?.id) return;
    await enrollmentService.deleteEnrollment(selectedEnrollment.id);
    setRefreshTick((x) => x + 1);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Enrollments (Admin)</h1>
        <p className="text-sm text-gray-500">Quản lý đăng ký khóa học của sinh viên.</p>
      </div>

      <DataTable<EnrollmentResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        toolbarSlot={
          <Button
            size="md"
            variant="success"
            onClick={openCreateModal}
          >
            Tạo mới
          </Button>
        }
        emptyState={{
          title: 'Chưa có đăng ký',
          description: 'Bấm "Tạo mới" để thêm đăng ký đầu tiên.',
          action: (
            <Button size="md" variant="success" onClick={openCreateModal}>
              Tạo ngay
            </Button>
          ),
        }}
        renderActions={(e) => (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openEditModal(e)}
            >
              Sửa
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openDeleteModal(e)}
            >
              Xóa
            </Button>
          </>
        )}
      />

      <CrudFormModal<EnrollmentFormValues>
        isOpen={createOpen}
        mode="create"
        initialValues={baseFormValues}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateEnrollment}
        description="Nhập thông tin đăng ký khóa học."
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">User ID</label>
              <input
                value={values.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="UUID sinh viên"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Course ID</label>
              <input
                value={values.courseId}
                onChange={(e) => handleChange('courseId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="UUID khóa học"
                required
              />
            </div>
          </div>
        )}
      />

      <CrudFormModal<EnrollmentFormValues>
        isOpen={editOpen}
        mode="update"
        initialValues={editFormValues}
        onClose={() => {
          setEditOpen(false);
          setSelectedEnrollment(null);
        }}
        onSubmit={handleUpdateEnrollment}
        description={`Cập nhật đăng ký ${selectedEnrollment?.id || ''}.`}
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">User ID</label>
              <input
                value={values.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                disabled
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Course ID</label>
              <input
                value={values.courseId}
                onChange={(e) => handleChange('courseId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                disabled
              />
            </div>
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedEnrollment?.id}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedEnrollment(null);
        }}
        onConfirm={async () => {
          await handleDeleteEnrollment();
          setDeleteOpen(false);
          setSelectedEnrollment(null);
        }}
        title="Xóa đăng ký"
      />
    </div>
  );
};

export default EnrollmentsAdmin;
