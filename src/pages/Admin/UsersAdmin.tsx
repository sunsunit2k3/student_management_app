import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import userService from "../../api/userService";
import { UserResponseDto } from "../../types/user";
import CrudFormModal from "../../components/modals/CrudFormModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roleName: string;
};

const UsersAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null);

  const baseFormValues = useMemo<UserFormValues>(() => ({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    roleName: "",
  }), []);
  const editFormValues = useMemo<UserFormValues>(
    () => ({
      firstName: selectedUser?.firstName || "",
      lastName: selectedUser?.lastName || "",
      email: selectedUser?.email || "",
      username: selectedUser?.username || "",
      password: "",
      roleName: selectedUser?.roleName || "",
    }),
    [selectedUser]
  );

  const columns: Column<UserResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (u) => u.id },
    { key: 'username', header: 'Username', sortable: true, render: (u) => u.username },
    { key: 'email', header: 'Email', sortable: true, render: (u) => u.email || '' },
    {
      key: 'fullName',
      header: 'Full Name',
      sortable: true,
      sortKey: 'lastName',
      render: (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    },
    {
      key: 'roleName',
      header: 'Role',
      render: (u) => `${u.roleName}`,
    },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (u) => (u.createdAt ? new Date(u.createdAt).toLocaleString() : '') },
    { key: 'updatedAt', header: 'Updated At', sortable: true, render: (u) => (u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '') },
  ];

  const fetchData = useCallback(async ({ page, size, query, filters }: FetchParams) => {
    // Treat `page` as 0-based from the pagination component
    const apiPage = Math.max(0, page);
    const params: any = { page: apiPage, size };
    
    if (filters?.role) params.role = filters.role;
    
    if (query) params.search = query;

    const res = await userService.getAllUsers(params);
    const list = res.data;

    let items: UserResponseDto[] = list?.content || [];

    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (`${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(q))
      );
    }
    return { items, total: list?.totalElements || items.length };
  }, [refreshTick]);

  function openCreateModal() {
    setSelectedUser(null);
    setCreateOpen(true);
  }

  function openEditModal(u: UserResponseDto) {
    setSelectedUser(u);
    setEditOpen(true);
  }

  function openDeleteModal(u: UserResponseDto) {
    setSelectedUser(u);
    setDeleteOpen(true);
  }

  async function handleCreateUser(values: UserFormValues) {
    await userService.createUser({
      firstName: values.firstName.trim() || undefined,
      lastName: values.lastName.trim() || undefined,
      email: values.email.trim(),
      username: values.username.trim(),
      password: values.password,
      roleName: values.roleName.trim(),
    });
    setRefreshTick((x) => x + 1);
  }

  async function handleUpdateUser(values: UserFormValues) {
    if (!selectedUser?.id) return;
    await userService.updateUser(selectedUser.id, {
      id: selectedUser.id,
      firstName: values.firstName.trim() || undefined,
      lastName: values.lastName.trim() || undefined,
      email: values.email.trim() || undefined,
      username: values.username.trim() || undefined,
      roleName: values.roleName.trim() || undefined,
    });
    setRefreshTick((x) => x + 1);
  }

  async function handleDeleteUser() {
    if (!selectedUser?.id) return;
    await userService.deleteUser(selectedUser.id);
    setRefreshTick((x) => x + 1);
  }

  const roles = useMemo(() => [
    { name: 'ADMIN' },
    { name: 'TEACHER' },
    { name: 'STUDENT' },
  ], []);

  const roleFilter = useMemo(() => ({
    name: 'role',
    options: roles.map((r) => ({ label: r.name, value: r.name })),
  }), [roles]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Users (Admin)</h1>
        <p className="text-sm text-gray-500">Quản lý người dùng và vai trò trong hệ thống.</p>
      </div>

      <DataTable<UserResponseDto>
        columns={columns}
        fetchData={fetchData}
        filters={[roleFilter]}
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
          title: 'Chưa có người dùng',
          description: 'Bấm "Tạo mới" để thêm người dùng đầu tiên.',
          action: (
            <Button size="md" variant="success" onClick={openCreateModal}>
              Tạo ngay
            </Button>
          ),
        }}
        renderActions={(u) => (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openEditModal(u)}
            >
              Sửa
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openDeleteModal(u)}
            >
              Xóa
            </Button>
          </>
        )}
      />

      <CrudFormModal<UserFormValues>
        isOpen={createOpen}
        mode="create"
        initialValues={baseFormValues}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateUser}
        description="Nhập thông tin người dùng mới."
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên đăng nhập</label>
              <input
                value={values.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Họ</label>
              <input
                value={values.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên</label>
              <input
                value={values.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mật khẩu</label>
              <input
                type="password"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Vai trò</label>
              <select
                value={values.roleName}
                onChange={(e) => handleChange('roleName', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                required
              >
                <option value="">Chọn vai trò</option>
                <option value="ADMIN">ADMIN</option>
                <option value="TEACHER">TEACHER</option>
                <option value="STUDENT">STUDENT</option>
              </select>
            </div>
          </div>
        )}
      />

      <CrudFormModal<UserFormValues>
        isOpen={editOpen}
        mode="update"
        initialValues={editFormValues}
        onClose={() => {
          setEditOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateUser}
        description={`Cập nhật người dùng ${selectedUser?.username || ''}.`}
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên đăng nhập</label>
              <input
                value={values.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email</label>
              <input
                type="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Họ</label>
              <input
                value={values.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên</label>
              <input
                value={values.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Vai trò</label>
              <select
                value={values.roleName}
                onChange={(e) => handleChange('roleName', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              >
                <option value="">Chọn vai trò</option>
                <option value="ADMIN">ADMIN</option>
                <option value="TEACHER">TEACHER</option>
                <option value="STUDENT">STUDENT</option>
              </select>
            </div>
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedUser?.username}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={async () => {
          await handleDeleteUser();
          setDeleteOpen(false);
          setSelectedUser(null);
        }}
        title="Xóa người dùng"
      />
    </div>
  );
};

export default UsersAdmin;
