import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import gradeItemService from "../../api/gradeItemService";
import { GradeItemResponseDto } from "../../types/gradeitem";
import CrudFormModal from "../../components/modals/CrudFormModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

type GradeItemFormValues = {
  courseId: string;
  name: string;
  description: string;
  dueDate: string;
  weight: string;
};

const GradeItemsAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGradeItem, setSelectedGradeItem] = useState<GradeItemResponseDto | null>(null);

  const baseFormValues = useMemo<GradeItemFormValues>(() => ({ courseId: "", name: "", description: "", dueDate: "", weight: "" }), []);
  const editFormValues = useMemo<GradeItemFormValues>(
    () => ({
      courseId: selectedGradeItem?.courseId || "",
      name: selectedGradeItem?.name || "",
      description: selectedGradeItem?.description || "",
      dueDate: selectedGradeItem?.dueDate || "",
      weight: selectedGradeItem?.weight?.toString() || "",
    }),
    [selectedGradeItem]
  );

  const columns: Column<GradeItemResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (g) => g.id },
    { key: 'name', header: 'Name', sortable: true, render: (g) => g.name },
    { key: 'weight', header: 'Weight', render: (g) => (g.weight ?? '-') },
    { key: 'dueDate', header: 'Due Date', render: (g) => (g.dueDate ? new Date(g.dueDate).toLocaleString() : '-') },
  ];

  const fetchData = useCallback(async ({ page = 0, size = 10, query, sortBy, sortOrder }: FetchParams) => {
    const res = await gradeItemService.getAllGradeItems();
    const payload: any = res.data;
    let items: GradeItemResponseDto[] = [];
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
      items = items.filter((it) => (it.name || '').toLowerCase().includes(q));
    }

    if (sortBy) {
      const direction = sortOrder === 'desc' ? -1 : 1;
      items = [...items].sort((a, b) => {
        const getValue = (record: GradeItemResponseDto) => {
          if (sortBy === 'id') return record.id ?? '';
          if (sortBy === 'name') return record.name ?? '';
          if (sortBy === 'weight') return record.weight ?? 0;
          if (sortBy === 'dueDate') return record.dueDate ?? '';
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
    setSelectedGradeItem(null);
    setCreateOpen(true);
  }

  function openEditModal(g: GradeItemResponseDto) {
    setSelectedGradeItem(g);
    setEditOpen(true);
  }

  function openDeleteModal(g: GradeItemResponseDto) {
    setSelectedGradeItem(g);
    setDeleteOpen(true);
  }

  async function handleCreateGradeItem(values: GradeItemFormValues) {
    await gradeItemService.createGradeItem({
      courseId: values.courseId.trim(),
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      dueDate: values.dueDate || undefined,
      weight: values.weight ? Number(values.weight) : undefined,
    });
    setRefreshTick((x) => x + 1);
  }

  async function handleUpdateGradeItem(values: GradeItemFormValues) {
    if (!selectedGradeItem?.id) return;
    await gradeItemService.updateGradeItem(selectedGradeItem.id, {
      id: selectedGradeItem.id,
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      dueDate: values.dueDate || undefined,
      weight: values.weight ? Number(values.weight) : undefined,
    });
    setRefreshTick(x => x + 1);
  }

  async function handleDeleteGradeItem() {
    if (!selectedGradeItem?.id) return;
    await gradeItemService.deleteGradeItem(selectedGradeItem.id);
    setRefreshTick(x => x + 1);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Grade Items (Admin)</h1>
        <p className="text-sm text-gray-500">Quản lý các hạng mục điểm và trọng số.</p>
      </div>

      <DataTable<GradeItemResponseDto>
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
          title: 'Chưa có hạng mục điểm',
          description: 'Bấm "Tạo mới" để tạo hạng mục điểm đầu tiên.',
          action: (
            <Button size="md" variant="success" onClick={openCreateModal}>
              Tạo ngay
            </Button>
          ),
        }}
        renderActions={(g) => (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openEditModal(g)}
            >
              Sửa
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openDeleteModal(g)}
            >
              Xóa
            </Button>
          </>
        )}
      />

      <CrudFormModal<GradeItemFormValues>
        isOpen={createOpen}
        mode="create"
        initialValues={baseFormValues}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateGradeItem}
        description="Nhập thông tin hạng mục điểm."
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên hạng mục</label>
              <input
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="VD: Midterm Exam"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mô tả</label>
              <textarea
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Trọng số</label>
              <input
                type="number"
                step="0.01"
                value={values.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Hạn nộp</label>
              <input
                type="datetime-local"
                value={values.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
          </div>
        )}
      />

      <CrudFormModal<GradeItemFormValues>
        isOpen={editOpen}
        mode="update"
        initialValues={editFormValues}
        onClose={() => {
          setEditOpen(false);
          setSelectedGradeItem(null);
        }}
        onSubmit={handleUpdateGradeItem}
        description={`Cập nhật hạng mục ${selectedGradeItem?.name || ''}.`}
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên hạng mục</label>
              <input
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mô tả</label>
              <textarea
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Trọng số</label>
              <input
                type="number"
                step="0.01"
                value={values.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Hạn nộp</label>
              <input
                type="datetime-local"
                value={values.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedGradeItem?.name}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedGradeItem(null);
        }}
        onConfirm={async () => {
          await handleDeleteGradeItem();
          setDeleteOpen(false);
          setSelectedGradeItem(null);
        }}
        title="Xóa hạng mục điểm"
      />
    </div>
  );
};

export default GradeItemsAdmin;
