import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import { getRoles, deleteRole, createRole, updateRole } from "../../api/rolesService";
import { RoleResponseDto } from "../../types/role";
import CrudFormModal from "../../components/modals/CrudFormModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

type RoleFormValues = {
  name: string;
};

const RolesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResponseDto | null>(null);

  const baseFormValues = useMemo<RoleFormValues>(() => ({ name: "" }), []);
  const editFormValues = useMemo<RoleFormValues>(
    () => ({
      name: selectedRole?.name || "",
    }),
    [selectedRole]
  );

  const columns: Column<RoleResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (r) => r.id },
    { key: 'name', header: 'Name', sortable: true, render: (r) => r.name },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : '') },
    { key: 'updatedAt', header: 'Updated At', sortable: true, render: (r) => (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '') },
  ];

  const fetchData = useCallback(async ({ page, size }: FetchParams) => {
    const apiPage = Math.max(0, page - 1);
    const res = await getRoles({ page: apiPage, size });
    const list = res.data;
    const items = list?.content || [];
    return { items, total: list?.totalElements || items.length };
  }, [refreshTick]);

  function openCreateModal() {
    setSelectedRole(null);
    setCreateOpen(true);
  }

  function openEditModal(r: RoleResponseDto) {
    setSelectedRole(r);
    setEditOpen(true);
  }

  function openDeleteModal(r: RoleResponseDto) {
    setSelectedRole(r);
    setDeleteOpen(true);
  }

  async function handleCreateRole(values: RoleFormValues) {
    await createRole({ name: values.name.trim() });
    setRefreshTick(x => x + 1);
  }

  async function handleUpdateRole(values: RoleFormValues) {
    if (!selectedRole?.id) return;
    await updateRole(selectedRole.id, { id: selectedRole.id, name: values.name.trim() });
    setRefreshTick(x => x + 1);
  }

  async function handleDeleteRole() {
    if (!selectedRole?.id) return;
    await deleteRole(selectedRole.id);
    setRefreshTick(x => x + 1);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Roles (Admin)</h1>
        <p className="text-sm text-gray-500">Quản lý vai trò và quyền hạn trong hệ thống.</p>
      </div>

      <DataTable<RoleResponseDto>
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
          title: 'Chưa có vai trò',
          description: 'Bấm "Tạo mới" để thêm vai trò đầu tiên.',
          action: (
            <Button size="sm" onClick={openCreateModal} className="bg-indigo-600 text-white hover:bg-indigo-700">
              Tạo ngay
            </Button>
          ),
        }}
        renderActions={(r) => (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openEditModal(r)}
            >
              Sửa
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openDeleteModal(r)}
            >
              Xóa
            </Button>
          </>
        )}
      />

      <CrudFormModal<RoleFormValues>
        isOpen={createOpen}
        mode="create"
        initialValues={baseFormValues}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateRole}
        description="Nhập tên vai trò mới."
        renderFields={({ values, handleChange }) => (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên vai trò</label>
            <input
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              placeholder="VD: ADMIN, TEACHER, STUDENT"
              required
            />
          </div>
        )}
      />

      <CrudFormModal<RoleFormValues>
        isOpen={editOpen}
        mode="update"
        initialValues={editFormValues}
        onClose={() => {
          setEditOpen(false);
          setSelectedRole(null);
        }}
        onSubmit={handleUpdateRole}
        description={`Cập nhật vai trò ${selectedRole?.name || ''}.`}
        renderFields={({ values, handleChange }) => (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên vai trò</label>
            <input
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              required
            />
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedRole?.name}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedRole(null);
        }}
        onConfirm={async () => {
          await handleDeleteRole();
          setDeleteOpen(false);
          setSelectedRole(null);
        }}
        title="Xóa vai trò"
      />
    </div>
  );
};

export default RolesAdmin;
