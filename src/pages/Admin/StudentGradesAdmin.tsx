import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import studentGradeService from "../../api/studentGradeService";
import { StudentGradeResponseDto } from "../../types/studentgrade";
import CrudFormModal from "../../components/modals/CrudFormModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

type StudentGradeFormValues = {
  enrollmentId: string;
  gradeItemId: string;
  score: string;
  isSubmitted: boolean;
};

const StudentGradesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<StudentGradeResponseDto | null>(null);

  const baseFormValues = useMemo<StudentGradeFormValues>(() => ({ enrollmentId: "", gradeItemId: "", score: "", isSubmitted: false }), []);
  const editFormValues = useMemo<StudentGradeFormValues>(
    () => ({
      enrollmentId: selectedGrade?.enrollmentId || "",
      gradeItemId: selectedGrade?.gradeItemId || "",
      score: selectedGrade?.score?.toString() || "",
      isSubmitted: selectedGrade?.isSubmitted || false,
    }),
    [selectedGrade]
  );

  const columns: Column<StudentGradeResponseDto>[] = [
    { key: "id", header: "ID", sortable: true, render: (g) => g.id },
    {
      key: "gradeItemId",
      header: "Grade Item",
      render: (g) => g.gradeItemId
    },
    {
      key: "score",
      header: "Score",
      render: (g) => (g.score != null ? String(g.score) : "-")
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (g) => (g.isSubmitted ? "Yes" : "No")
    }
  ];

  const fetchData = useCallback(
    async ({ page, size }: FetchParams) => {
      const res = await studentGradeService.getAllGrades({
        page,
        size,
      });

      const payload = res.data;

      return {
        items: payload?.content || [],
        total: payload?.totalElements || 0
      };
    },
    [refreshTick]
  );

  function openCreateModal() {
    setSelectedGrade(null);
    setCreateOpen(true);
  }

  function openEditModal(g: StudentGradeResponseDto) {
    setSelectedGrade(g);
    setEditOpen(true);
  }

  function openDeleteModal(g: StudentGradeResponseDto) {
    setSelectedGrade(g);
    setDeleteOpen(true);
  }

  async function handleCreateGrade(values: StudentGradeFormValues) {
    await studentGradeService.createStudentGrade({
      enrollmentId: values.enrollmentId.trim(),
      gradeItemId: values.gradeItemId.trim(),
      score: values.score ? Number(values.score) : undefined,
      isSubmitted: values.isSubmitted,
    });
    setRefreshTick((x) => x + 1);
  }

  async function handleUpdateGrade(values: StudentGradeFormValues) {
    if (!selectedGrade?.id) return;
    await studentGradeService.updateStudentGrade(selectedGrade.id, {
      id: selectedGrade.id,
      score: values.score ? Number(values.score) : undefined,
      isSubmitted: values.isSubmitted,
    });
    setRefreshTick((x) => x + 1);
  }

  async function handleDeleteGrade() {
    if (!selectedGrade?.id) return;
    await studentGradeService.deleteStudentGrade(selectedGrade.id);
    setRefreshTick((x) => x + 1);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Student Grades (Admin)</h1>
        <p className="text-sm text-gray-500">Quản lý điểm số của sinh viên theo từng hạng mục.</p>
      </div>

      <DataTable<StudentGradeResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        toolbarSlot={
          <Button
            size="md"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
            onClick={openCreateModal}
          >
            Tạo mới
          </Button>
        }
        emptyState={{
          title: 'Chưa có điểm',
          description: 'Bấm "Tạo mới" để thêm điểm đầu tiên.',
          action: (
            <Button size="sm" onClick={openCreateModal} className="bg-indigo-600 text-white hover:bg-indigo-700">
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

      <CrudFormModal<StudentGradeFormValues>
        isOpen={createOpen}
        mode="create"
        initialValues={baseFormValues}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateGrade}
        description="Nhập thông tin điểm sinh viên."
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Enrollment ID</label>
              <input
                value={values.enrollmentId}
                onChange={(e) => handleChange('enrollmentId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="UUID enrollment"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Grade Item ID</label>
              <input
                value={values.gradeItemId}
                onChange={(e) => handleChange('gradeItemId', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="UUID hạng mục điểm"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Điểm</label>
              <input
                type="number"
                step="0.01"
                value={values.score}
                onChange={(e) => handleChange('score', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={values.isSubmitted}
                onChange={(e) => handleChange('isSubmitted', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Đã nộp</label>
            </div>
          </div>
        )}
      />

      <CrudFormModal<StudentGradeFormValues>
        isOpen={editOpen}
        mode="update"
        initialValues={editFormValues}
        onClose={() => {
          setEditOpen(false);
          setSelectedGrade(null);
        }}
        onSubmit={handleUpdateGrade}
        description={`Cập nhật điểm ${selectedGrade?.id || ''}.`}
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Điểm</label>
              <input
                type="number"
                step="0.01"
                value={values.score}
                onChange={(e) => handleChange('score', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={values.isSubmitted}
                onChange={(e) => handleChange('isSubmitted', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Đã nộp</label>
            </div>
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedGrade?.id}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedGrade(null);
        }}
        onConfirm={async () => {
          await handleDeleteGrade();
          setDeleteOpen(false);
          setSelectedGrade(null);
        }}
        title="Xóa điểm"
      />
    </div>
  );
};

export default StudentGradesAdmin;
