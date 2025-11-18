import { useCallback, useMemo, useState } from 'react';
import Button from '../ui/button/Button';
import DataTable, { Column, FetchParams } from './DataTable';
import userService from '../../api/userService';
import { UserResponseDto } from '../../types/user';

export default function UsersTable() {
  const [refreshTick, setRefreshTick] = useState(0);

  const columns: Column<UserResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (u: UserResponseDto) => u.id },
    { key: 'username', header: 'Username', sortable: true, render: (u: UserResponseDto) => u.username },
    { key: 'email', header: 'Email', sortable: true, render: (u: UserResponseDto) => u.email || '' },
    {
      key: 'fullName',
      header: 'Full Name',
      sortable: true,
      sortKey: 'lastName',
      render: (u: UserResponseDto) => `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    },
    {
      key: 'roleName',
      header: 'Role',
      render: (u: UserResponseDto) => `${u.roleName}`,
    },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (u: UserResponseDto) => (u.createdAt ? new Date(u.createdAt).toLocaleString() : '') },
    { key: 'updatedAt', header: 'Updated At', sortable: true, render: (u: UserResponseDto) => (u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '') },
  ];

  const fetchData = useCallback(async ({ page, size, query, filters }: FetchParams) => {
    const apiPage = Math.max(0, page - 1);
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

  async function handleDelete(u: UserResponseDto) {
    if (!u.id) return;
    const ok = window.confirm(`Xóa người dùng ${u.username}?`);
    if (!ok) return;
    try {
      await userService.deleteUser(u.id);
      setRefreshTick((x) => x + 1);
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  }

  function handleEdit(u: UserResponseDto) {
    // TODO: Mở modal hoặc chuyển trang chỉnh sửa
    alert(`Cập nhật người dùng: ${u.username}`);
  }
  const roles = useMemo(() => [
    {name: 'ADMIN' },
    {name: 'TEACHER' },
    {name: 'STUDENT' },
  ], []);

  const roleFilter = useMemo(() => ({
    name: 'role',
    options: roles.map((r) => ({ label: r.name, value: r.name })),
  }), [roles]);

  return (
    <DataTable<UserResponseDto>
      columns={columns}
      fetchData={fetchData}
      filters={[roleFilter]}
      initialPageSize={10}
      actionsHeader="Actions"
      renderActions={(u) => (
        <>
          <Button size="md" variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleEdit(u)}>
            Cập nhật
          </Button>
          <Button size="md" variant="primary" className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(u)}>
            Xóa
          </Button>
        </>
      )}
    />
  );
}
